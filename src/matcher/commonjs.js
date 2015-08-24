'use strict';

var detective = require('detective-cjs');
var log = require('debug')('galvatron:matcher:commonjs');

module.exports = function ($fs) {
  return function (file, code) {
    if (!code) {
      return [];
    }

    return detective(code).map(function (impValue) {
      var cwd = process.cwd() + '/';
      var impPath = $fs.ext($fs.resolve(impValue, file), 'js', ['js', 'json']);
      log('import', file.replace(cwd, ''), '->', impPath.replace(cwd, ''));
      return {
        path: impPath,
        value: impValue
      };
    });
  };
};
