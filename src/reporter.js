function Reporter ($events) {
  this._events = $events;
  this._reporters = [];
}

Reporter.prototype = {
  use: function (reporter) {
    if (typeof reporter === 'string') {
      reporter = require('./reporter/' + reporter);
    }

    reporter(this._events);
    return this;
  }
};

module.exports = Reporter;
