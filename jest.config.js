const path = require('path');

module.exports = {
  collectCoverageFrom: ['**/*.{js,jsx}', '!**/node_modules/**', '!jest.config.js', '!**/coverage/lcov-report/**'],
  coveragePathIgnorePatterns: ['<rootDir>/webpack.*.js', 'dist/'],

  // per https://github.com/facebook/jest/issues/9396#issuecomment-573328488
  coverageReporters: ['json', 'text', 'lcov', 'clover'],

  coverageThreshold: {
    global: {
      branches: 88,
      functions: 85,
      lines: 90,
      statements: 90,
    },
  },

  rootDir: './',
  setupFiles: [path.join(__dirname, '/lib/enzyme')],
  testMatch: ['**/__tests__/**/(*[._])+test.[jt]s?(x)'],
  testURL: 'http://localhost',
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
};
