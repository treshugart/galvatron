'use strict';

var recast = require('recast');

function Transformer () {
  this._transformers = [];
}

Transformer.prototype = {
  transform: function (file) {
    var parsed = recast.parse(file.code, {
      sourceFileName: file.path
    });
    var transformed = this._transformers.reduce(function (value, transformer) {
      var res = transformer(value);
      return {
        ast: res.ast,
        code: recast.print(res.ast).code,
        imports: file.imports,
        map: res.map,
        path: file.path
      };
    }, {
      ast: parsed,
      code: recast.print(parsed).code,
      imports: file.imports,
      map: null,
      path: file.path
    });

    return transformed;
  },

  add: function (transformer, args) {
    if (typeof transformer === 'string') {
      transformer = require('./transform/' + transformer).apply(null, args);
    }

    if (typeof transformer !== 'function') {
      throw new Error('Transformer must be a function.');
    }

    this._transformers.push(transformer);
    return this;
  }
};

module.exports = Transformer;
