'use strict';

var expect = require('chai').expect;
var mocha = require('mocha');
var galv = require('../index')();

mocha.describe('matcher/amd', function () {
  mocha.it('should not error if containing ES6 syntax', function () {
    var data = 'import something from "./something";';
    galv.matcher('test.js', data);
  });

  mocha.it('named define', function () {
    var data = 'define("name", ["something"])';
    var deps = galv.matcher('test.js', data);
    expect(deps[0].value).to.equal('something');
  });

  mocha.it('anonymous define', function () {
    var data = 'define(["something"])';
    var deps = galv.matcher('test.js', data);
    expect(deps[0].value).to.equal('something');
  });

  mocha.it('nested define()', function () {
    var data = '(function () { define(["something"]); }());';
    var deps = galv.matcher('test.js', data);
    expect(deps[0].value).to.equal('something');
  });
});
