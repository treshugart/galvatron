'use strict';

module.exports = function regexToArray (regex, str) {
  var match;
  var matches = [];

  while ((match = regex.exec(str))) {
    matches.push(match);
  }

  return matches;
};
