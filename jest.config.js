/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // Standalone games in games/ have their own test runners.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/games/'],
  moduleNameMapper: {
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
