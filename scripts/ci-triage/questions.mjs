// Every question, criterion and threshold the CI triage sends to Jev (decision 013).
// Keep wording here so it can be reviewed and tuned in one place.

export const MODEL = 'jev-latest';

// Noul thresholds: above YES reads as yes, below NO as no, in between is unsettled.
export const YES = 0.7;
export const NO = 0.3;

export const QUESTIONS = {
  ci_environment: {
    type: 'noul',
    instructions:
      'Did `failed_step` fail because of the CI machine or an outside service, rather than because of the code in the repository?',
    criteria: {
      true: 'A network timeout, a failed download from the npm registry or Docker Hub, a rate limit, the runner running out of disk or memory, or a container that did not start',
      false:
        'A lint error, a type error, a failing test, a failing SQL test or migration, or a generated file that is out of date',
    },
  },
  lockfile_mismatch: {
    type: 'noul',
    instructions: 'Does `log_tail` show npm refusing to install because package.json and package-lock.json do not match?',
    criteria: {
      true: 'npm ci reports that the lock file is out of sync with package.json or is missing packages',
      false: 'The dependencies installed, or npm failed for a different reason such as a network error',
    },
  },
  has_root_cause_line: {
    type: 'noul',
    instructions: 'Does one of `candidate_lines` state the error that made `failed_step` fail?',
    criteria: {
      true: 'One line names the actual error, such as the failing test, the type error or the lint rule',
      false: 'The lines are only summaries, progress output or the final exit code',
    },
  },
};

// Built per job, because its options are that job's own log lines.
export function rootCauseQuestion(candidates) {
  const criteria = {};
  candidates.forEach((line, i) => {
    criteria[`line_${i + 1}`] = line;
  });
  return {
    type: 'choice',
    instructions: 'Which line states the error that made `failed_step` fail?',
    criteria,
  };
}

// What to run locally for each failed step (code, not Jev: the step name is exact).
export const STEP_HINTS = {
  'App (lint, typecheck, test, web build)': {
    Lint: 'Run `npm run lint` and fix the errors it lists.',
    Typecheck: 'Run `npm run typecheck` and fix the type errors.',
    Test: 'Run `npm test` and fix the failing tests.',
    'Build web': 'Run `npm run build:web`; the web export failed.',
  },
  'Database (migrations, seed, RLS tests)': {
    'Start Supabase (applies migrations and seed)':
      'Run `npm run db:reset`; a migration or `supabase/seed.sql` failed to apply.',
    'Lint schema': 'Run `npm run db:lint` and fix the schema errors.',
    'RLS tests': 'Run `npm run db:test` and fix the failing pgTAP tests.',
    'Generated types are up to date':
      '`src/lib/database.types.ts` is stale: run `npm run db:types` and commit the result.',
  },
  'Game (Ringward typecheck, test, build)': {
    Test: 'Run `npm test` in `games/ringward` and fix the failing tests.',
    'Build (typecheck + Vite)': 'Run `npm run build` in `games/ringward`; the typecheck or Vite build failed.',
  },
};

// Steps whose failure code can explain without asking Jev anything.
export const NO_JEV_STEPS = new Set(['Generated types are up to date']);
