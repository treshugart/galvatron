'use strict';

var amd = require('./amd');
var commonJs = require('./commonjs');
var compound = require('./compound');
var es6 = require('./es6');

module.exports = function ($fs) {
  return compound([
    amd($fs),
    commonJs($fs),
    es6($fs)
  ]);
};
