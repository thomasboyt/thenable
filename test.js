var promisesAplusTests = require('promises-aplus-tests');

describe("Promises/A+ Tests", function () {
  require("promises-aplus-tests").mocha(require('./test-adapter'));
});
