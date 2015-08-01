'use strict';

function Reporter ($events) {
  this._events = $events;
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
