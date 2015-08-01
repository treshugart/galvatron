'use strict';

var detective = require('detective-amd');

module.exports = function ($fs) {
  return function (file) {
    return detective(file.code).filter(function (imp) {
      return ['exports', 'module', 'require'].indexOf(imp) === -1;
    }).map(function (imp) {
      return {
        code: imp,
        path: $fs.ext($fs.resolve(imp, file.path), 'js')
      };
    });
  };
};
