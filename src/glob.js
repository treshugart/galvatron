'use strict';

var glob = require('glob');
var path = require('path');

module.exports = function (patterns) {
  var found = [];

  if (!Array.isArray(patterns)) {
    patterns = [patterns];
  }

  patterns.forEach(function (pattern) {
    glob.sync(pattern).forEach(function (file) {
      found.push(path.resolve(file));
    });
  });

  return found;
};
