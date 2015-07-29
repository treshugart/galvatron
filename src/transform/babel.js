'use strict';

var babel = require('babel');
var recast = require('recast');

module.exports = function (options) {
  return function (data) {
    return babel.transform(recast.print(data.ast).code, options);
  };
};
