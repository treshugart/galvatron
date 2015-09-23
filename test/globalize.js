'use strict';

var expect = require('chai').expect;
var mocha = require('mocha');
var globalize = require('../src/globalize');
var stream = require('stream');
var util = require('util');

mocha.describe('globalize', function () {
  function Read(data) {
    stream.Readable.call(this, {objectMode: true});
    this._data = data;
  }

  util.inherits(Read, stream.Readable);

  Read.prototype._read = function () {
    this.push({
      contents: {
        toString: function () {
          return this._data;
        }.bind(this)
      },
      imports: [],
      path: 'test.js'
    });
  };

  function Write(func) {
    stream.Writable.call(this, {objectMode: true});
    this._write = func;
  }

  util.inherits(Write, stream.Writable);

  function file (data, func) {
    var read = new Read(data);
    var write = new Write(func);
    return read.pipe(globalize()).pipe(write);
  }

  function format () {
    return [].slice.call(arguments).join('\n');
  }

  mocha.it('Should not affect any code around the "use strict" statement', function (done) {
    file(
      format(
        '',
        '"use strict";',
        '',
        'function something () {',
        '  "use strict";',
        '  return function () {};',
        '}'
      ),
      function (vinyl) {
        expect(vinyl.contents.toString()).to.equal(format(
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
          '    return function () {};',
          '  }',
          '  ',
          '  return module.exports;',
          '}).call(this);'
        ));
        done();
      }
    );
  });

  mocha.describe('amd', function () {
    mocha.it('define() as first thing in string', function (done) {
      file('define()', function (vinyl) {
        expect(vinyl.contents.toString()).to.contain('var define = function defineReplacement');
        done();
      });
    });

    mocha.it('define() anywhere in a string', function (done) {
      file('something && define()', function (vinyl) {
        expect(vinyl.contents.toString()).to.contain('var define = function defineReplacement');
        done();
      });
    });

    mocha.it('define() as part of another function call (i.e. somedefine())', function (done) {
      file('somedefine()', function (vinyl) {
        expect(vinyl.contents.toString()).to.not.contain('var define = function defineReplacement');
        done();
      });
    });
  });
});
