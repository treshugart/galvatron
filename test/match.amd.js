'use strict';

var expect = require('chai').expect;
var mocha = require('mocha');
var match = require('../src/match/amd');

mocha.describe('matcher/amd', function () {
  mocha.it('should not error if code is empty', function () {
    match({
      contents: {
        toString: function () {
          return '';
        }
      }
    });
  });

  mocha.it('should not error if containing ES6 syntax', function () {
    match({
      contents: {
        toString: function () {
          return 'import something from "./something";';
        }
      }
    });
  });

  mocha.it('should not error if containing JSX', function () {
    match({
      contents: {
        toString: function () {
          return '<jsx />';
        }
      }
    });
  });

  mocha.it('named define', function () {
    var deps = match({
      contents: {
        toString: function () {
          return 'define("name", ["something"])';
        }
      }
    });
    expect(deps[0]).to.equal('something');
  });

  mocha.it('anonymous define', function () {
    var deps = match({
      contents: {
        toString: function () {
          return 'define(["something"])';
        }
      }
    });
    expect(deps[0]).to.equal('something');
  });

  mocha.it('nested define()', function () {
    var deps = match({
      contents: {
        toString: function () {
          return '(function () { define(["something"]); }());';
        }
      }
    });
    expect(deps[0]).to.equal('something');
  });
});
