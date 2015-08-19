'use strict';

var regexToArray = require('../util/regex-to-array');

module.exports = function ($fs) {
  return function (file, code) {
    if (!code) {
      return [];
    }

    return regexToArray(/^\s*@import\s*([^'"\s]*)\s*['"]([^'"]+)['"];?/gm, code).map(function (imp) {
      return {
        path: $fs.ext($fs.resolve(imp[2], file), 'less', ['css', 'less']),
        type: imp[1],
        value: imp[2]
      };
    });
  };
};
