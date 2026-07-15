module.exports = {
  testEnvironment: 'node',
  testTimeout: 15000,
  verbose: true,
  maxWorkers: 1,
  forceExit: true,
  globalSetup: './tests/globalSetup.js',
  testMatch: ['**/tests/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/backend/**/*.js',
    '!src/backend/server.js',
  ],
  coverageThreshold: {
    global: { lines: 70, branches: 60, functions: 75, statements: 70 },
  },
};
