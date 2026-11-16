#!/usr/bin/env bash
# Create GitHub milestones, labels and one issue per ticket from docs/backlog.md.
#
# Dry run by default: parses and validates the backlog and prints what it would create, without
# calling GitHub. Pass --apply to create things. Safe to re-run: existing milestones, labels and
# issues (matched by the "[P2-APP-01]" title prefix, open or closed) are skipped, never edited.
#
# The repo is public, so --apply publishes every ticket. Get the project lead's OK first.
#
# Usage:
#   scripts/create-backlog-issues.sh                       # dry run
#   scripts/create-backlog-issues.sh --apply               # create milestones, labels, issues
#   scripts/create-backlog-issues.sh --apply --include-stretch   # also file V2 items (no milestone)
#   Options: --repo owner/name (default rresnik2/gametime), --backlog path (default docs/backlog.md)
#
# Needs Node (the project's Node 24) and, for --apply, the GitHub CLI logged in (`gh auth status`).

set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v node >/dev/null 2>&1; then
  echo "error: node is required" >&2
  exit 1
fi

node - "$@" <<'JS'
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');

// ---------------------------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------------------------

const args = process.argv.slice(2);
const opts = { apply: false, stretch: false, repo: 'rresnik2/gametime', backlog: 'docs/backlog.md' };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--apply') opts.apply = true;
  else if (a === '--include-stretch') opts.stretch = true;
  else if (a === '--repo') opts.repo = args[++i];
  else if (a === '--backlog') opts.backlog = args[++i];
  else if (a === '-h' || a === '--help') {
    console.log('Usage: scripts/create-backlog-issues.sh [--apply] [--include-stretch] [--repo owner/name] [--backlog path]');
    process.exit(0);
  } else fail(`unknown option: ${a}`);
}
if (!/^[\w.-]+\/[\w.-]+$/.test(opts.repo || '')) fail('--repo must be owner/name');

function fail(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------------------------
// What gets created
// ---------------------------------------------------------------------------------------------

const MILESTONES = {
  2: { title: 'Phase 2: Watch the feed', description: 'Weeks 3–5: auth, profiles, live feed, video playback. See docs/backlog.md.' },
  3: { title: 'Phase 3: Go live and chat', description: 'Weeks 6–8: OBS streaming, chat, follow, discover. See docs/backlog.md.' },
  4: { title: 'Phase 4: Polish and demo', description: 'Weeks 9–10: testing, seed streams, safety, demo day. See docs/backlog.md.' },
};

const WORKSTREAMS = {
  APP: 'ws:app',
  DATA: 'ws:backend',
  VID: 'ws:video',
  GAME: 'ws:game',
  DES: 'ws:design',
  OPS: 'ws:devops-qa',
};

const LABELS = {
  'ws:app': ['1f6feb', 'Workstream: Expo app screens and components'],
  'ws:backend': ['0e8a16', 'Workstream: Supabase schema, RPCs, Edge Functions'],
  'ws:video': ['d93f0b', 'Workstream: streaming provider, playback, webhooks'],
  'ws:game': ['7c5cff', 'Workstream: the original browser game'],
  'ws:design': ['e99695', 'Workstream: design and product'],
  'ws:devops-qa': ['5319e7', 'Workstream: CI, releases, testing'],
  'size:S': ['c2e0c6', 'Up to a day'],
  'size:M': ['fef2c0', 'Two to three days'],
  'size:L': ['f9d0c4', 'About a person-week'],
  'blocked:D1': ['b60205', 'Waits on decision 001: streaming provider'],
  'blocked:D4': ['b60205', 'Waits on decision 004: anonymous viewing'],
  'blocked:game-concept': ['b60205', 'Waits on the game concept pick'],
  safety: ['ff3b5c', 'Safety basics: report, block, chat filters, age gate, terms'],
  'cold-start': ['2ef2c3', 'Empty-feed mitigation'],
  accessibility: ['f143ab', 'Barrier affecting people with disabilities'],
  demo: ['fbca04', 'Demo-day preparation'],
  'v2-stretch': ['cfd3d7', 'Post-MVP stretch item; not scheduled'],
};

const BLOCKERS = [
  [/\bD1\b/, 'blocked:D1'],
  [/\bD4\b/, 'blocked:D4'],
  [/\bGAME\b/, 'blocked:game-concept'],
];

// ---------------------------------------------------------------------------------------------
// Parse docs/backlog.md
// ---------------------------------------------------------------------------------------------

const HEADING = /^#### ((?:P([234])-(APP|DATA|VID|GAME|DES|OPS)-\d{2})|V2-\d{2}) · (.+)$/;
const FIELDS =
  /^- \*\*Size:\*\* (S|M|L) · \*\*Owner:\*\* (.+?) · \*\*Depends on:\*\* (.+?) · \*\*Blocked on:\*\* (.+?)(?: · \*\*Tags:\*\* (.+))?$/;

const lines = fs.readFileSync(opts.backlog, 'utf8').split('\n');
const tickets = [];
let section = null; // 2 | 3 | 4 | 'stretch' | null
let current = null;

const finish = () => {
  if (!current) return;
  while (current.body.length && current.body[current.body.length - 1].trim() === '') current.body.pop();
  while (current.body.length && current.body[0].trim() === '') current.body.shift();
  tickets.push(current);
  current = null;
};

let inFence = false;
for (const line of lines) {
  if (line.startsWith('```')) inFence = !inFence;
  if (inFence && !current) continue; // examples in code blocks aren't tickets
  if (line.startsWith('## ')) {
    finish();
    const m = line.match(/^## Phase ([234])\b/);
    section = m ? Number(m[1]) : /^## Stretch/.test(line) ? 'stretch' : null;
    continue;
  }
  const h = line.match(HEADING);
  if (h) {
    finish();
    current = { id: h[1], phase: h[2] ? Number(h[2]) : 'stretch', ws: h[3] || null, title: h[4].trim(), body: [], section };
    continue;
  }
  if (current && (line.startsWith('#') || line.trim() === '---')) {
    finish();
    continue;
  }
  if (current) current.body.push(line);
}
finish();

// ---------------------------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------------------------

const errors = [];
const ids = new Set();
for (const t of tickets) {
  if (ids.has(t.id)) errors.push(`${t.id}: duplicate ID`);
  ids.add(t.id);
  if (t.phase !== t.section) errors.push(`${t.id}: listed under the wrong section (${t.section})`);
  t.labels = [];
  if (t.phase === 'stretch') {
    t.labels.push('v2-stretch');
    continue;
  }
  const f = t.body.find((l) => l.startsWith('- **Size:**'));
  const m = f && f.match(FIELDS);
  if (!m) {
    errors.push(`${t.id}: missing or malformed "- **Size:** … · **Owner:** … · **Depends on:** … · **Blocked on:** …" line`);
    continue;
  }
  const [, size, , depends, blocked, tags] = m;
  t.size = size;
  t.depends = depends;
  t.blocked = blocked;
  t.labels.push(WORKSTREAMS[t.ws], `size:${size}`);
  for (const [re, label] of BLOCKERS) if (re.test(blocked)) t.labels.push(label);
  for (const tag of (tags || '').split(',').map((s) => s.trim()).filter(Boolean)) {
    if (!LABELS[tag]) errors.push(`${t.id}: unknown tag "${tag}"`);
    t.labels.push(tag);
  }
  if (!t.body.some((l) => l.startsWith('- [ ] '))) errors.push(`${t.id}: no acceptance criteria ("- [ ] …")`);
}
for (const t of tickets) {
  for (const dep of (t.depends || '').match(/\bP[234]-[A-Z]+-\d{2}\b/g) || []) {
    if (!ids.has(dep)) errors.push(`${t.id}: depends on unknown ticket ${dep}`);
  }
}
if (!tickets.length) errors.push(`no tickets found in ${opts.backlog}`);
if (errors.length) fail(`${opts.backlog} has problems:\n  ${errors.join('\n  ')}`);

const scheduled = tickets.filter((t) => t.phase !== 'stretch');
const stretch = tickets.filter((t) => t.phase === 'stretch');
const toFile = opts.stretch ? tickets : scheduled;

// ---------------------------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------------------------

const wsKeys = Object.keys(WORKSTREAMS);
console.log(`Backlog: ${opts.backlog}  →  ${opts.repo}`);
console.log(['Phase', ...wsKeys, 'Total'].join('\t'));
for (const p of [2, 3, 4]) {
  const inPhase = scheduled.filter((t) => t.phase === p);
  console.log([p, ...wsKeys.map((w) => inPhase.filter((t) => t.ws === w).length), inPhase.length].join('\t'));
}
console.log(['All', ...wsKeys.map((w) => scheduled.filter((t) => t.ws === w).length), scheduled.length].join('\t'));
for (const [, label] of BLOCKERS) {
  console.log(`${label}: ${scheduled.filter((t) => t.labels.includes(label)).length}`);
}
console.log(`Stretch (v2): ${stretch.length}${opts.stretch ? ' (will be filed)' : ' (not filed; pass --include-stretch)'}`);
console.log('');

const issueTitle = (t) => `[${t.id}] ${t.title}`;
const issueBody = (t) =>
  [
    ...t.body,
    '',
    '---',
    `Ticket \`${t.id}\` from [docs/backlog.md](https://github.com/${opts.repo}/blob/main/docs/backlog.md). ` +
      'Once filed, this issue is the source of truth for owner and progress.',
  ].join('\n');

if (!opts.apply) {
  for (const t of toFile) {
    const ms = t.phase === 'stretch' ? '(no milestone)' : MILESTONES[t.phase].title;
    console.log(`would create: ${issueTitle(t)}\n    ${ms} · ${t.labels.join(', ')}`);
  }
  console.log(`\nDry run: nothing was sent to GitHub. Re-run with --apply to create ${toFile.length} issues.`);
  process.exit(0);
}

// ---------------------------------------------------------------------------------------------
// Apply (idempotent)
// ---------------------------------------------------------------------------------------------

const gh = (ghArgs, input) =>
  execFileSync('gh', ghArgs, { input, encoding: 'utf8', stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'inherit'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  try {
    gh(['auth', 'status']);
  } catch {
    fail('gh is not logged in; run `gh auth login` first');
  }

  // Labels: create only the missing ones, so existing labels (e.g. "accessibility") keep their settings.
  const existingLabels = new Set(
    gh(['label', 'list', '--repo', opts.repo, '--limit', '500', '--json', 'name', '--jq', '.[].name']).split('\n').filter(Boolean),
  );
  const needed = new Set(toFile.flatMap((t) => t.labels));
  for (const name of needed) {
    if (existingLabels.has(name)) continue;
    const [color, description] = LABELS[name];
    gh(['label', 'create', name, '--repo', opts.repo, '--color', color, '--description', description]);
    console.log(`label created: ${name}`);
  }

  // Milestones (open or closed count as existing).
  const existingMilestones = new Set(
    gh(['api', '--paginate', `repos/${opts.repo}/milestones?state=all&per_page=100`, '--jq', '.[].title']).split('\n').filter(Boolean),
  );
  for (const p of [2, 3, 4]) {
    const { title, description } = MILESTONES[p];
    if (existingMilestones.has(title)) continue;
    gh(['api', '-X', 'POST', `repos/${opts.repo}/milestones`, '-f', `title=${title}`, '-f', `description=${description}`]);
    console.log(`milestone created: ${title}`);
  }

  // Issues: skip any whose title already starts with "[ID]".
  const existingIds = new Set(
    gh(['issue', 'list', '--repo', opts.repo, '--state', 'all', '--limit', '2000', '--json', 'title', '--jq', '.[].title'])
      .split('\n')
      .map((title) => (title.match(/^\[([A-Z0-9-]+)\]/) || [])[1])
      .filter(Boolean),
  );
  let created = 0;
  let skipped = 0;
  for (const t of toFile) {
    if (existingIds.has(t.id)) {
      skipped++;
      continue;
    }
    const ghArgs = ['issue', 'create', '--repo', opts.repo, '--title', issueTitle(t), '--body-file', '-'];
    if (t.phase !== 'stretch') ghArgs.push('--milestone', MILESTONES[t.phase].title);
    for (const label of t.labels) ghArgs.push('--label', label);
    const url = gh(ghArgs, issueBody(t)).trim();
    console.log(`created ${t.id}: ${url}`);
    created++;
    await sleep(1500); // stay under GitHub's secondary rate limit for content creation
  }
  console.log(`\nDone: ${created} issues created, ${skipped} already existed.`);
})().catch((e) => fail(e.message));
JS
