'use strict';

var expect = require('chai').expect;
var mocha = require('mocha');
var galv = require('../index')();

mocha.describe('matcher/commonjs', function () {
  mocha.it('should not error if code is empty', function () {
    galv.matcher('test.js', '');
  });

  mocha.it('should not error if containing ES6 syntax', function () {
    var data = 'import something from "./something";';
    galv.matcher('test.js', data);
  });

  mocha.it('returns dependencies', function () {
    var data = 'require("something1"); require("something2")';
    var deps = galv.matcher('test.js', data);
    expect(deps[0].value).to.equal('something1');
    expect(deps[1].value).to.equal('something2');
  });
});
