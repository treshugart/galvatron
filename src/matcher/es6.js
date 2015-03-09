'use strict';

var regexToArray = require('../util/regex-to-array');

module.exports = function () {
  return function (code) {
    return regexToArray(/^\s*import[^'"]*['"]([^'"]+)['"];?/gm, code).map(function (imp) {
      return imp[1];
    });
  };
};
