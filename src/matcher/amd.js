'use strict';

var detective = require('detective-amd');
var log = require('debug')('galvatron:matcher:amd');

module.exports = function ($fs) {
  return function (file, code) {
    return detective(code).map(function (imp) {
      log('resolving amd dependency', imp, 'from', file);
      return {
        path: $fs.ext($fs.resolve(imp, file), 'js', ['js', 'json']),
        value: imp
      };
    });
  };
};
