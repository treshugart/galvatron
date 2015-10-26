'use strict';

var expect = require('chai').expect;
var mocha = require('mocha');
var match = require('../src/match/es6');

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

  mocha.it('returns dependencies', function () {
    var deps = match({
      contents: {
        toString: function () {
          return 'import "something1";\n import something from "something2";';
        }
      }
    });
    expect(deps[0]).to.equal('something1');
    expect(deps[1]).to.equal('something2');
  });
});
