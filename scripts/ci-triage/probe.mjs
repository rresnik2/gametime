#!/usr/bin/env node
// Sends every fixture in fixtures/ to Jev and compares the answers with expected.json.
// Run after changing questions.mjs:  node scripts/ci-triage/probe.mjs
// Live calls (one per fixture); needs TYPESAFE_API_KEY. The fixtures are synthetic logs.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRequest, candidateLines, cleanLog, decide, failedStepTail } from './triage.mjs';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const expected = JSON.parse(fs.readFileSync(path.join(dir, 'expected.json'), 'utf8'));

let failures = 0;
let tokens = 0;
for (const [file, want] of Object.entries(expected)) {
  const tail = failedStepTail(cleanLog(fs.readFileSync(path.join(dir, file), 'utf8')));
  const candidates = candidateLines(tail);
  const request = buildRequest({ job: want.job, step: want.step, tail, candidates });
  const res = await fetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.TYPESAFE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    console.log(`${file}: Jev ${res.status} ${await res.text()}`);
    failures++;
    continue;
  }
  const { answers, usage } = await res.json();
  tokens += usage?.input_tokens ?? 0;
  const f = decide({ job: want.job, step: want.step, candidates, answers });
  const problems = [];
  for (const k of ['ci_environment', 'lockfile_mismatch']) if (f.signals[k] !== want[k]) problems.push(`${k}=${f.signals[k]}`);
  if (want.rootContains && !f.rootLine?.includes(want.rootContains)) problems.push(`root=${JSON.stringify(f.rootLine)}`);
  const raw = Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v.noul ?? `${v.choice} (${v.confidence?.toFixed(2)})`]));
  console.log(`${problems.length ? 'MISS' : 'ok  '} ${file}  ${JSON.stringify(raw)}${problems.length ? `  -> ${problems.join(', ')}` : ''}`);
  if (problems.length) failures++;
}
console.log(`\n${Object.keys(expected).length - failures}/${Object.keys(expected).length} as expected; ${tokens} input tokens`);
process.exit(failures ? 1 : 0);
