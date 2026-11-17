// Pure logic for CI failure triage: log parsing, the Jev request, and the decision table.
// No network here; see run.mjs for GitHub and Jev calls.

import { MODEL, NO, NO_JEV_STEPS, QUESTIONS, STEP_HINTS, YES, rootCauseQuestion } from './questions.mjs';

export const MARKER = '<!-- jev-ci-triage -->';
const TAIL_LINES = 200;
const MAX_TAIL_CHARS = 24000; // well under Jev's 32k-token per-question limit
const MAX_CANDIDATES = 30;
const MAX_LINE_CHARS = 300;

const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z ?/;
const ANSI = /\u001b\[[0-9;]*[A-Za-z]/g;

/** Strips GitHub's per-line timestamps and terminal colour codes. */
export function cleanLog(raw) {
  return raw
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(TIMESTAMP, '').replace(ANSI, '').trimEnd());
}

/**
 * The output of the step that failed: the lines after its "##[group]Run …" header, up to the
 * first "##[error]" line that follows. Falls back to the end of the log.
 */
export function failedStepTail(lines) {
  let end = lines.findIndex((l) => l.startsWith('##[error]'));
  if (end === -1) end = lines.length;
  let start = 0;
  for (let i = end - 1; i >= 0; i--) {
    if (lines[i].startsWith('##[group]Run ')) {
      start = i;
      break;
    }
  }
  const tail = lines
    .slice(Math.max(start, end - TAIL_LINES), end + 1)
    .filter((l) => !/^##\[(group|endgroup)\]$/.test(l));
  let text = tail.join('\n');
  if (text.length > MAX_TAIL_CHARS) text = text.slice(text.length - MAX_TAIL_CHARS);
  return text;
}

const ERRORISH = /\berror\b|\bERR!|\bFAIL\b|✕|●|\bfailed\b|\bnot ok\b|\bExpected\b|\bReceived\b|\bTS\d{4}\b|\bfatal\b/i;
const GENERIC = /^##\[error\]Process completed with exit code \d+\.?$/;

/** Lines that might state the root cause, in log order, for Jev to choose from. */
export function candidateLines(tail) {
  const seen = new Set();
  const out = [];
  for (const raw of tail.split('\n')) {
    const line = raw.trim().replace(/^##\[error\]/, '');
    if (!line || GENERIC.test(raw.trim()) || !ERRORISH.test(line)) continue;
    const clipped = line.length > MAX_LINE_CHARS ? `${line.slice(0, MAX_LINE_CHARS)}…` : line;
    if (seen.has(clipped)) continue;
    seen.add(clipped);
    out.push(clipped);
  }
  return out.slice(-MAX_CANDIDATES);
}

/** The Jev request for one failed job, or null when code alone can explain the failure. */
export function buildRequest({ job, step, tail, candidates }) {
  if (NO_JEV_STEPS.has(step)) return null;
  const questions = { ...QUESTIONS };
  if (candidates.length) questions.root_cause_line = rootCauseQuestion(candidates);
  else delete questions.has_root_cause_line;
  return {
    model: MODEL,
    state: {
      repository: 'GameTime: an Expo (React Native) app with a Supabase database, tested in GitHub Actions',
      ci_job: job,
      failed_step: step,
      log_tail: tail,
      ...(candidates.length ? { candidate_lines: candidates } : {}),
    },
    questions,
  };
}

const band = (p) => (p === undefined ? 'unasked' : p > YES ? 'yes' : p < NO ? 'no' : 'unsure');

/**
 * The decision table. Jev's answers are inputs; what to tell the developer is decided here.
 * `answers` is the Jev response's `answers` object, or null when Jev wasn't asked or failed.
 */
export function decide({ job, step, candidates, answers, jevError }) {
  const hint = STEP_HINTS[job]?.[step];
  const env = band(answers?.ci_environment?.noul);
  const lock = band(answers?.lockfile_mismatch?.noul);
  const root = band(answers?.has_root_cause_line?.noul);

  let verdict;
  let action;
  if (lock === 'yes') {
    verdict = 'package-lock.json is out of sync with package.json';
    action = 'Run `npx expo install` (or `npm install` for a dev tool), then commit `package-lock.json`.';
  } else if (env === 'yes') {
    verdict = 'Probably not your code: the CI machine or an outside service failed';
    action = 'Re-run the failed jobs. If it fails the same way twice, read the log.';
  } else if (hint) {
    verdict = env === 'unsure' ? 'Likely a problem in the code, possibly a flaky CI run' : 'A problem in the code';
    action = env === 'unsure' ? `${hint} If the log doesn't point at your change, re-run once.` : hint;
  } else {
    verdict = 'Unclassified failure';
    action = 'Read the log for this step.';
  }

  let rootLine = null;
  if (root === 'yes' && answers?.root_cause_line?.choice) {
    const index = Number(answers.root_cause_line.choice.replace('line_', '')) - 1;
    rootLine = candidates[index] ?? null;
  }

  return {
    job,
    step,
    verdict,
    action,
    rootLine,
    signals: { ci_environment: env, lockfile_mismatch: lock, has_root_cause_line: root },
    jevError: jevError ?? null,
  };
}

const fence = (text) => `~~~\n${text.replace(/~~~/g, '~ ~ ~')}\n~~~`;

/** Markdown for the PR comment and the job summary. */
export function renderReport({ runUrl, findings }) {
  const parts = [MARKER, `### CI failure triage`, `For [this run](${runUrl}). Suggestions only; the log is the source of truth.`];
  for (const f of findings) {
    parts.push(`**${f.job}** failed at **${f.step}**`);
    parts.push(`- ${f.verdict}.\n- ${f.action}`);
    if (f.rootLine) parts.push(`Likely cause:\n${fence(f.rootLine)}`);
    if (f.jevError) parts.push(`_Jev triage failed (${f.jevError}); the suggestion above comes from the step name only._`);
  }
  parts.push(
    `<sub>Judgments from Jev (TypeSafe), decisions in code: \`scripts/ci-triage/\`, decision 013. Signals: ${findings
      .map((f) => Object.entries(f.signals).map(([k, v]) => `${k}=${v}`).join(' '))
      .join(' · ')}</sub>`,
  );
  return parts.join('\n\n');
}
