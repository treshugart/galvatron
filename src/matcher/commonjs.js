'use strict';

var regexToArray = require('../util/regex-to-array');

module.exports = function ($fs) {
  return function (file, code) {
    return regexToArray(/require\([\'"]([^\'"]+)[\'"]\)/g, code).map(function (imp) {
      return {
        path: $fs.ext($fs.resolve(imp[1], file), 'js', ['js', 'json']),
        value: imp[1]
      };
    });
  };
};
