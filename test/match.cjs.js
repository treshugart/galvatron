'use strict';

var expect = require('chai').expect;
var mocha = require('mocha');
var match = require('../src/match/cjs');

mocha.describe('matcher/commonjs', function () {
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

  mocha.it('returns dependencies', function () {
    var deps = match({
      contents: {
        toString: function () {
          return 'require("something1"); require("something2")';
        }
      }
    });
    expect(deps[0]).to.equal('something1');
    expect(deps[1]).to.equal('something2');
  });
});
