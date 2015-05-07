'use strict';

var expect = require('chai').expect;
var mocha = require('mocha');
var transform = require('../src/transform/globalize');

mocha.describe('transform/globalize', function () {
  var globalize;

  function format () {
    return [].slice.call(arguments).join('\n');
  }

  mocha.beforeEach(function () {
    globalize = transform();
  });

  mocha.it('Should not affect any code around the "use strict" statement', function () {
    var data = format(
      '',
      '"use strict";',
      '',
      'function something () {',
      '  "use strict";',
      '  return function () {})();',
      '}'
    );
    var result = globalize(data, {
      imports: [],
      path: 'test.js'
    });
    expect(result).to.equal(format(
      '// test.js',
      '__1dd241c4cd3fd1dd89c570cee98b79dd = (function () {',
      '  var module = {',
      '    exports: {}',
      '  };',
      '  var exports = module.exports;',
      '  ',
      '  ',
      '  ',
      '  function something () {',
      '    return function () {})();',
      '  }',
      '  ',
      '  return module.exports;',
      '}).call(this);'
    ));
  });
});
