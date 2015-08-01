'use strict';

var detective = require('detective-es6');

module.exports = function ($fs) {
  return function (file) {
    return detective(file.code).map(function (imp) {
      return {
        code: imp,
        path: $fs.ext($fs.resolve(imp, file.path), 'js')
      };
    });
  };
};
