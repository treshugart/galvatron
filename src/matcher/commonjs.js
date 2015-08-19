'use strict';

var detective = require('detective-cjs');
var log = require('debug')('galvatron:matcher:commonjs');

module.exports = function ($fs) {
  return function (file, code) {
    if (!code) {
      return [];
    }

    return detective(code).map(function (imp) {
      log('resolving commonjs dependency', imp, 'from', file);
      return {
        path: $fs.ext($fs.resolve(imp, file), 'js', ['js', 'json']),
        value: imp
      };
    });
  };
};
