'use strict';

var expect = require('chai').expect;
var mocha = require('mocha');
var recast = require('recast');
var transform = require('../src/transform/babel');

function parse (data) {
  var name = 'test.js';
  return {
    ast: recast.parse(data),
    map: false,
    name: name
  };
}

function print (data) {
  return recast.print(data.ast, {
    inputSourceMap: data.map
  }).code;
}

mocha.describe('transform.babel', function () {
  mocha.it('should generate source maps', function () {
    var babel = transform({ sourceMaps: true });
    var output = babel(parse('import something from "something";'));
    expect(output.map).to.not.equal(null);
  });
});
