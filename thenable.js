// select best queue function based on environment
var queue;
if (typeof window === 'undefined' && typeof module === 'object') {
  queue = function(wrapped) {
    process.nextTick(wrapped);
  };
} else {
  queue = function(wrapped) {
    setTimeout(wrapped, 0);
  };
}

var Resolver = function(promise) {
  this.promise = promise;
  this.resolved = undefined;
};

Resolver.prototype.fulfill = function(value, synchronous) {
  if (this.resolved === true) return;
  this.resolved = true;

  var promise = this.promise;
  promise.state = 'fulfilled';
  promise.value = value;

  if (synchronous) {
    promise.fulfillCallbacks.forEach(function(cb) {
      cb(value);
    });
  }
  else {
    queue(function() {
      this.fulfillCallbacks.forEach(function(cb) {
        cb(value);
      });
    }.bind(promise));
  }
};

Resolver.prototype.resolve = function(value, synchronous) {
  if (this.resolved === true) return;
  this.resolved = true;

  var then;
  if (typeof value === 'object') {
    try {
      then = value.then;
    } catch (e) {
      this.reject(e, synchronous);
    }
  }

  // todo: proper isCallable()
  if (typeof then === 'function') {
    try {
      then.call(value, this.resolve, this.reject);
    } catch (e) {
      this.reject(e, synchronous);
    }
  }

  this.fulfill(value, synchronous);
};

Resolver.prototype.reject = function(value, synchronous) {
  if (this.resolved === true) return;
  this.resolved = true;

  var promise = this.promise;
  promise.state = 'rejected';
  promise.result = value;

  if (synchronous) {
    promise.rejectCallbacks.forEach(function(cb) {
      cb(value);
    });
  }
  else {
    queue(function() {
      this.rejectCallbacks.forEach(function(cb) {
        cb(value);
      });
    }.bind(promise));
  }
};

Resolver.prototype._promiseWrapperCallback = function(cb) {
  return function(argument) {
    try {
      var value = cb(argument);
    } catch (e) {
      this.resolver.reject(e, true);
    }
  }.bind(this.promise);
}

var Promise = function(init) {
  this.fulfillCallbacks = [];
  this.rejectCallbacks = [];
  this.state = 'pending';
  this.result = undefined;

  this.resolver = new Resolver(this);

  try {
    init.call(this, this.resolver);
  } catch(e) {
    if (this.resolver.resolved !== true) {
      this.resolver.reject(e);
    }
  }

  return this;
};

Promise.prototype.then = function(onFulfilled, onRejected) {
  var promise = new Promise();
  if (typeof onFulfilled === 'function') {
    var fulfillWrapper = promise.resolver._promiseWrapperCallback(onFulfilled);
    this.fulfillCallbacks.push(fulfillWrapper);
  }
  else {
    this.fulfillCallbacks.push(function(value) {
      this.resolver.fulfill(value, true);
    }.bind(this));
  }
  if (typeof onRejected === 'function') {
    var rejectWrapper = promise.resolver._promiseWrapperCallback(onRejected);
    this.rejectCallbacks.push(rejectWrapper);
  }
  else {
    this.rejectCallbacks.push(function(value) {
      this.resolver.reject(value, true);
    }.bind(this));
  }
  return promise;
};

module.exports = Promise;