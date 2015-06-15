'use strict';

var mocha = require('mocha');
var galv = require('../index')();

mocha.describe('matcher/commonjs', function () {
  mocha.it('should not error if containing ES6 syntax', function () {
    var data = 'import something from "./something";';
    galv.matcher('test.js', data);
  });
});
