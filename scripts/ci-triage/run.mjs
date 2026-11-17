#!/usr/bin/env node
// CI failure triage with Jev (decision 013).
//
//   node scripts/ci-triage/run.mjs --run <run id> [--repo owner/name] [--comment] [--dry-run]
//       Triage a failed GitHub Actions run (needs GH_TOKEN). --comment posts or updates one PR
//       comment; the report also goes to $GITHUB_STEP_SUMMARY when set.
//   node scripts/ci-triage/run.mjs --log <file> --job "<job name>" --step "<step name>" [--dry-run]
//       Triage a saved job log, for trying out questions locally.
//
// --dry-run prints the Jev request instead of sending it. Needs TYPESAFE_API_KEY otherwise.
// Sends only the failed step's log tail, never secrets: GitHub masks secrets in logs.

import fs from 'node:fs';
import { buildRequest, candidateLines, cleanLog, decide, failedStepTail, MARKER, renderReport } from './triage.mjs';

const JEV_URL = 'https://api.typesafe.ai/v1/systemone';
const MAX_JOBS = 3;

function parseArgs(argv) {
  const opts = { repo: process.env.GITHUB_REPOSITORY || 'rresnik2/gametime', comment: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--run') opts.run = argv[++i];
    else if (a === '--repo') opts.repo = argv[++i];
    else if (a === '--log') opts.log = argv[++i];
    else if (a === '--job') opts.job = argv[++i];
    else if (a === '--step') opts.step = argv[++i];
    else if (a === '--comment') opts.comment = true;
    else if (a === '--dry-run') opts.dryRun = true;
    else throw new Error(`unknown option: ${a}`);
  }
  if (!opts.run && !(opts.log && opts.job && opts.step)) throw new Error('pass --run <id>, or --log, --job and --step');
  return opts;
}

async function github(path, { method = 'GET', body, raw = false } = {}) {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GH_TOKEN is not set');
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`GitHub ${method} ${path}: ${res.status}`);
  return raw ? res.text() : res.json();
}

async function askJev(request) {
  const key = process.env.TYPESAFE_API_KEY;
  if (!key) throw new Error('TYPESAFE_API_KEY is not set');
  const res = await fetch(JEV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Jev ${res.status}`);
  return res.json();
}

async function triageJob({ job, step, rawLog, dryRun }) {
  const tail = failedStepTail(cleanLog(rawLog));
  const candidates = candidateLines(tail);
  const request = buildRequest({ job, step, tail, candidates });
  let answers = null;
  let jevError = null;
  let usage = null;
  if (request && dryRun) {
    console.log(JSON.stringify(request, null, 2));
  } else if (request) {
    try {
      const response = await askJev(request);
      answers = response.answers;
      usage = response.usage;
    } catch (e) {
      jevError = e.message; // a failed call is an error, never a "no"
    }
  }
  return { finding: decide({ job, step, candidates, answers, jevError }), answers, usage };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.log) {
    const result = await triageJob({ job: opts.job, step: opts.step, rawLog: fs.readFileSync(opts.log, 'utf8'), dryRun: opts.dryRun });
    console.log(JSON.stringify(result, null, 2));
    return result.finding.jevError ? 1 : 0;
  }

  const [owner, name] = opts.repo.split('/');
  const base = `/repos/${owner}/${name}`;
  const run = await github(`${base}/actions/runs/${opts.run}`);
  const { jobs } = await github(`${base}/actions/runs/${opts.run}/jobs?per_page=100`);
  const failed = jobs.filter((j) => j.conclusion === 'failure').slice(0, MAX_JOBS);
  if (!failed.length) {
    console.log('No failed jobs in this run.');
    return 0;
  }

  const findings = [];
  for (const j of failed) {
    const step = j.steps?.find((s) => s.conclusion === 'failure')?.name ?? '(unknown step)';
    const rawLog = await github(`${base}/actions/jobs/${j.id}/logs`, { raw: true });
    const { finding, usage } = await triageJob({ job: j.name, step, rawLog, dryRun: opts.dryRun });
    if (usage) console.log(`${j.name}: ${usage.input_tokens} input tokens`);
    findings.push(finding);
  }

  const report = renderReport({ runUrl: run.html_url, findings });
  console.log(report);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);

  if (opts.comment && !opts.dryRun) {
    const pulls = await github(`${base}/commits/${run.head_sha}/pulls`);
    const pr = pulls.find((p) => p.state === 'open');
    if (pr) {
      const comments = await github(`${base}/issues/${pr.number}/comments?per_page=100`);
      const mine = comments.find((c) => c.user?.type === 'Bot' && c.body?.includes(MARKER));
      if (mine) await github(`${base}/issues/comments/${mine.id}`, { method: 'PATCH', body: { body: report } });
      else await github(`${base}/issues/${pr.number}/comments`, { method: 'POST', body: { body: report } });
      console.log(`Commented on PR #${pr.number}`);
    }
  }
  return findings.some((f) => f.jevError) ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (e) => {
    console.error(`error: ${e.message}`);
    process.exit(1);
  },
);
