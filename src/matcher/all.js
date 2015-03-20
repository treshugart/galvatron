'use strict';

var commonJs = require('./commonjs');
var compound = require('./compound');
var es6 = require('./es6');
var less = require('./less');

module.exports = function ($fs) {
  return compound($fs, [
    commonJs,
    es6,
    less
  ]);
};
