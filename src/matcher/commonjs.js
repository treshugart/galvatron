'use strict';

var regexToArray = require('../util/regex-to-array');

module.exports = function () {
  return function (code) {
    return regexToArray(/require\([\'"]([^\'"]+)[\'"]\)/g, code).map(function (req) {
      return req[1];
    });
  };
};
