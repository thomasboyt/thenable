var Promise = require('./thenable');

module.exports = {
  pending: function() {
    var promise = new Promise(function() {});
    return {
      promise: promise,
      fulfill: promise.resolver.fulfill,
      reject: promise.resolver.reject
    }
  }
}