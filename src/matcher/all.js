'use strict';

var CommonJs = require('./commonjs');
var Compound = require('./compound');
var Es6 = require('./es6');

module.exports = function () {
  return new Compound([
    new CommonJs(),
    new Es6()
  ]);
};
