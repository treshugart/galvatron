'use strict';

var babel = require('babel');
var recast = require('recast');

module.exports = function () {
  return function (data) {
    return babel.transform(data.code, {
      inputSourceMap: data.map,
      sourceFileName: data.path,
      sourceMaps: true,
      sourceMapTarget: data.path
    });
  };
};
