'use strict';

var expect = require('chai').expect;
var mocha = require('mocha');
var recast = require('recast');
var transform = require('../src/transform/globalize');

function parse (data) {
  var name = 'test.js';
  var parsed = recast.parse(data, { sourceFileName: name });
  return {
    ast: parsed,
    map: recast.print(parsed, { sourceMapName: name }).map,
    name: name
  };
}

function print (data) {
  return recast.print(data.ast, {
    inputSourceMap: data.map
  }).code;
}

mocha.describe('transform.globalize', function () {
  var globalize;

  mocha.beforeEach(function () {
    globalize = transform();
  });

  mocha.it('Should not affect any code around the "use strict" statement', function () {
    var data = parse([
      '',
      '"use strict";',
      '',
      'function something () {',
      '  "use strict";',
      '  return function () {};',
      '}'
    ].join('\n'));
    var result = globalize({
      ast: data.ast,
      imports: [],
      path: 'test.js'
    });
    expect(print(result)).to.equal([
      '// test.js',
      '__1dd241c4cd3fd1dd89c570cee98b79dd = (function () {',
      '  var module = { exports: {} };',
      '  var exports = module.exports;',
      '',
      '  function something () {',
      '    return function () {};',
      '  }',
      '',
      '  return module.exports;',
      '}).call(this);'
    ].join('\n'));
  });

  mocha.describe('amd', function () {
    mocha.it('define() as first thing in string', function () {
      var data = parse('define()');
      var result = globalize({
        ast: data.ast,
        imports: [],
        path: 'test.js'
      });
      expect(print(result)).to.contain('var define = function defineReplacement');
    });

    mocha.it('define() anywhere in a string', function () {
      var data = parse('something && define()');
      var result = globalize({
        ast: data.ast,
        imports: [],
        path: 'test.js'
      });
      expect(print(result)).to.contain('var define = function defineReplacement');
    });

    mocha.it('define() as part of another function call (i.e. somedefine())', function () {
      var data = parse('somedefine()');
      var result = globalize({
        ast: data.ast,
        imports: [],
        path: 'test.js'
      });
      expect(print(result)).to.not.contain('var define = function defineReplacement');
    });
  });

  mocha.describe('source maps', function () {
    var input = [
      '"use strict";',
      'function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }',
      'var _something = require("something");',
      'var _something2 = _interopRequireDefault(_something);',
      '//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVua25vd24iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozt5QkFBc0IsV0FBVyIsImZpbGUiOiJ1bmtub3duIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHNvbWV0aGluZyBmcm9tIFwic29tZXRoaW5nXCI7Il19'
    ].join('\n\n');

    mocha.it('ignore if no source map is found', function () {
      var output = globalize({
        ast: parse('"use strict"; var test = "test";').ast,
        path: 'test.js',
        imports: []
      });
      expect(print(output)).to.not.contain('sourceMappingURL');
    });

    mocha.it('transform source map', function () {
      var parsed = parse(input);
      var output = globalize({
        ast: parsed.ast,
        imports: [{
          path: 'something',
          value: '"something"'
        }],
        map: parsed.map,
        path: 'test.js'
      });
    });
  });
});
