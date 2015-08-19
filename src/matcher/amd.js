'use strict';

var detective = require('detective-amd');
var log = require('debug')('galvatron:matcher:amd');

module.exports = function ($fs) {
  return function (file, code) {
    if (!code) {
      return [];
    }

    return detective(code).filter(function (imp) {
      return ['exports', 'module', 'require'].indexOf(imp) === -1;
    }).map(function (imp) {
      log('resolving amd dependency', imp, 'from', file);
      return {
        path: $fs.ext($fs.resolve(imp, file), 'js', ['js', 'json']),
        value: imp
      };
    });
  };
};
