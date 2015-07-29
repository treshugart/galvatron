'use strict';

var regexToArray = require('../util/regex-to-array');

module.exports = function () {
  return function (code) {
    return regexToArray(/^\s*@import\s*([^'"\s]*)\s*['"]([^'"]+)['"];?/gm, code).map(function (imp) {
      return {
        path: imp[2],
        type: imp[1]
      };
    });
  };
};
