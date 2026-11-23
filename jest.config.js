/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // Standalone games in games/ have their own test runners; scripts/ uses node --test
  // (npm run test:scripts). .claude/ holds Claude Code worktrees, which are full repo copies.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/games/', '<rootDir>/scripts/', '<rootDir>/.claude/'],
  moduleNameMapper: {
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
