import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildRequest, candidateLines, cleanLog, decide, failedStepTail, MARKER, renderReport } from './triage.mjs';

const APP = 'App (lint, typecheck, test, web build)';
const DB = 'Database (migrations, seed, RLS tests)';

const log = [
  '2026-11-17T18:00:00.0000000Z ##[group]Run npm run lint',
  '2026-11-17T18:00:01.0000000Z \u001b[31m/src/app/index.tsx\u001b[0m',
  '2026-11-17T18:00:01.1000000Z   12:7  error  \'x\' is assigned a value but never used  no-unused-vars',
  '2026-11-17T18:00:01.2000000Z ✖ 1 problem (1 error, 0 warnings)',
  '2026-11-17T18:00:02.0000000Z ##[error]Process completed with exit code 1.',
  '2026-11-17T18:00:03.0000000Z Post job cleanup.',
].join('\n');

test('cleanLog strips timestamps and colour codes', () => {
  const lines = cleanLog(log);
  assert.equal(lines[0], '##[group]Run npm run lint');
  assert.equal(lines[1], '/src/app/index.tsx');
});

test('failedStepTail keeps only the failed step, up to its error line', () => {
  const tail = failedStepTail(cleanLog(`2026-11-17T17:59:00Z ##[group]Run npm ci\n2026-11-17T17:59:01Z added 900 packages\n${log}`));
  assert.match(tail, /^##\[group\]Run npm run lint/);
  assert.doesNotMatch(tail, /added 900 packages/);
  assert.doesNotMatch(tail, /Post job cleanup/);
  assert.match(tail, /exit code 1/);
});

test('candidateLines keeps error lines and drops the generic exit line', () => {
  const lines = candidateLines(failedStepTail(cleanLog(log)));
  assert.deepEqual(lines, [
    "12:7  error  'x' is assigned a value but never used  no-unused-vars",
    '✖ 1 problem (1 error, 0 warnings)',
  ]);
});

test('buildRequest skips Jev for the types-drift step and omits the root-cause pair without candidates', () => {
  assert.equal(buildRequest({ job: DB, step: 'Generated types are up to date', tail: 'x', candidates: [] }), null);
  const req = buildRequest({ job: APP, step: 'Lint', tail: 'x', candidates: [] });
  assert.ok(req.questions.ci_environment);
  assert.equal(req.questions.root_cause_line, undefined);
  assert.equal(req.questions.has_root_cause_line, undefined);
  assert.equal(req.state.candidate_lines, undefined);
});

test('buildRequest adds a choice over the candidate lines', () => {
  const req = buildRequest({ job: APP, step: 'Test', tail: 'x', candidates: ['a failed', 'b error'] });
  assert.deepEqual(req.questions.root_cause_line.criteria, { line_1: 'a failed', line_2: 'b error' });
});

const answers = (env, lock, root, choice = 'line_1') => ({
  ci_environment: { noul: env },
  lockfile_mismatch: { noul: lock },
  has_root_cause_line: { noul: root },
  root_cause_line: { choice },
});

test('decide: a lock-file mismatch wins over everything', () => {
  const f = decide({ job: APP, step: 'Lint', candidates: [], answers: answers(0.9, 0.9, 0.1) });
  assert.match(f.verdict, /package-lock/);
});

test('decide: a CI-environment failure says re-run', () => {
  const f = decide({ job: DB, step: 'Start Supabase (applies migrations and seed)', candidates: [], answers: answers(0.85, 0.05, 0.1) });
  assert.match(f.action, /Re-run/);
});

test('decide: a code failure gives the step hint and the chosen line', () => {
  const f = decide({ job: APP, step: 'Test', candidates: ['x', 'FAIL src/a.test.tsx'], answers: answers(0.05, 0.02, 0.9, 'line_2') });
  assert.match(f.action, /npm test/);
  assert.equal(f.rootLine, 'FAIL src/a.test.tsx');
});

test('decide: the unsure band adds a re-run note and no root line below the threshold', () => {
  const f = decide({ job: APP, step: 'Typecheck', candidates: ['x'], answers: answers(0.5, 0.02, 0.5) });
  assert.match(f.verdict, /possibly a flaky/);
  assert.match(f.action, /re-run once/);
  assert.equal(f.rootLine, null);
});

test('decide: a failed Jev call falls back to the step hint and is reported', () => {
  const f = decide({ job: APP, step: 'Lint', candidates: [], answers: null, jevError: 'Jev 500' });
  assert.match(f.action, /npm run lint/);
  assert.deepEqual(f.signals, { ci_environment: 'unasked', lockfile_mismatch: 'unasked', has_root_cause_line: 'unasked' });
  assert.match(renderReport({ runUrl: 'u', findings: [f] }), /Jev triage failed \(Jev 500\)/);
});

test('decide: types drift needs no Jev answers', () => {
  const f = decide({ job: DB, step: 'Generated types are up to date', candidates: [], answers: null });
  assert.match(f.action, /npm run db:types/);
});

test('renderReport carries the marker and fences log text safely', () => {
  const f = decide({ job: APP, step: 'Test', candidates: ['~~~ break out'], answers: answers(0.1, 0.1, 0.9) });
  const md = renderReport({ runUrl: 'https://example.test/run', findings: [f] });
  assert.ok(md.startsWith(MARKER));
  assert.match(md, /~ ~ ~ break out/);
});
