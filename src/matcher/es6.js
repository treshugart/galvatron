'use strict';

var detective = require('detective-es6');
var log = require('debug')('galvatron:matcher:es6');

module.exports = function ($fs) {
  return function (file, code) {
    if (!code) {
      return [];
    }

    return detective(code).map(function (imp) {
      log('resolving es6 dependency', imp, 'from', file);
      return {
        path: $fs.ext($fs.resolve(imp, file), 'js', ['js', 'json']),
        value: imp
      };
    });
  };
};
