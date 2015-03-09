'use strict';

function Matcher (matchers) {
  this._matchers = matchers;
}

Matcher.prototype = {
  match: function (code) {
    var matches = [];

    this._matchers.forEach(function (matcher) {
      matches = matches.concat(matcher.match(code));
    });

    return matches;
  }
};

module.exports = Matcher;
