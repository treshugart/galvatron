'use strict';

var babel = require('babel');
var recast = require('recast');

module.exports = function (options) {
  return function (data) {
    var out = babel.transform(recast.print(data.ast).code, options);
    data.ast = out.ast;
    data.map = out.map;
    return data;
  };
};
