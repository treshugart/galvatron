'use strict';

var debug = require('debug');
var log = debug('galvatron:matcher:commonjs');
var regexToArray = require('../util/regex-to-array');
var removeComments = require('../util/remove-comments');

module.exports = function ($fs) {
  return function (file, code) {
    // Replace comments just in case they have require blocks in them.
    code = removeComments(code);
    return regexToArray(/require\([\'"]([^\'"]+)[\'"]\)/g, code).map(function (imp) {
      log('resolving commonjs dependency', imp, 'from', file);
      return {
        path: $fs.ext($fs.resolve(imp[1], file), 'js', ['js', 'json']),
        value: imp[1]
      };
    });
  };
};
