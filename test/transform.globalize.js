'use strict';

var expect = require('chai').expect;
var mocha = require('mocha');
var transform = require('../src/transform/globalize');

mocha.describe('transform/globalize', function () {
  function format () {
    return [].slice.call(arguments).join('\n');
  }

  function globalize (data) {
    return transform()(data, {
      imports: [],
      path: 'test.js'
    });
  }

  mocha.it('should not affect any code around the "use strict" statement', function () {
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
      '(typeof window === \'undefined\' ? global : window).__1dd241c4cd3fd1dd89c570cee98b79dd = (function () {',
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

  mocha.describe('amd', function () {
    mocha.it('should supply a local AMD shim', function () {
      var data = format('define(function(){});');
      var code = globalize(data);
      expect(code).to.contain('var define = function defineReplacement(');
    });

    mocha.describe('should work with an AMD loader already on the page', function () {
      var args = [];

      function run (moduleCode) {
        var data = format(moduleCode);
        var code = globalize(data);
        eval(code);
      }

      mocha.beforeEach(function () {
        global.define = function () {
          args = arguments;
        };
      });

      mocha.afterEach(function () {
        delete global.define;
      });

      mocha.it('function', function () {
        run('define(function(){});');
        expect(args.length).to.equal(1);
        expect(args[0]).to.be.a('function');
      });

      mocha.it('deps + function', function () {
        run('define([], function(){});');
        expect(args.length).to.equal(2);
        expect(args[0]).to.be.an('array');
        expect(args[1]).to.be.a('function');
      });

      mocha.it('name + function', function () {
        run('define("name", function(){});');
        expect(args.length).to.equal(2);
        expect(args[0]).to.be.a('string');
        expect(args[1]).to.be.a('function');
      });

      mocha.it('name + deps + function', function () {
        run('define("name", [], function(){});');
        expect(args.length).to.equal(3);
        expect(args[0]).to.be.a('string');
        expect(args[1]).to.be.an('array');
        expect(args[2]).to.be.a('function');
      });
    });
  });
});
