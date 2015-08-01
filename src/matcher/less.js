'use strict';

var regexToArray = require('../util/regex-to-array');

module.exports = function ($fs) {
  return function (file) {
    return regexToArray(/^\s*@import\s*([^'"\s]*)\s*['"]([^'"]+)['"];?/gm, file.code).map(function (imp) {
      var code = imp[2];
      var type = imp[1];
      return {
        code: code,
        path:  $fs.ext($fs.resolve(code, file.path), type || 'less', ['css', 'less']),
        type: type
      };
    });
  };
};
