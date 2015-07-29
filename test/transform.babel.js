'use strict';

var expect = require('chai').expect;
var mocha = require('mocha');
var transform = require('../src/transform/babel');

mocha.describe('transform.babel', function () {
  mocha.it('should default to inline sourcemaps', function () {
    var babel = transform({ sourceMaps: 'inline' });
    var output = babel('import something from "something";');
    expect(output).to.contain('//# sourceMappingURL=data:application/json;base64,');
  });
});
