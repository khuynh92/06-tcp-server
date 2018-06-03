module.exports = function () {
  return {
    files: [
      'lib/**/*.js',
      '!__test__/**/*.spec.js',
    ],

    tests: [
      '__test__/**/*.spec.js',
    ],

    testFramework: 'jest',
    env: {
      type: 'node',
    },
  };
};