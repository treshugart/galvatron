'use strict';

var expect = require('chai').expect;
var mocha = require('mocha');
var galv = require('../index')();

mocha.describe('matcher/commonjs', function () {
  mocha.it('should not error if containing ES6 syntax', function () {
    var data = 'import something from "./something";';
    galv.matcher(data);
  });

  mocha.it('returns dependencies', function () {
    var data = 'require("something1"); require("something2")';
    var deps = galv.matcher(data);
    expect(deps[0].path).to.equal('something1');
    expect(deps[1].path).to.equal('something2');
  });
});
