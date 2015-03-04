'use strict';

var glob = require('glob');

module.exports = function (paths) {
  var found = [];

  if (!Array.isArray(paths)) {
    paths = [paths];
  }

  paths.forEach(function (path) {
    found = found.concat(glob.sync(path));
  });

  return found;
};
