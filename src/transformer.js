'use strict';

function Transformer () {
  this._transformers = [];
}

Transformer.prototype = {
  transform: function (data) {
    return this._transformers.map(function (transformer) {
      return transformer(data);
    });
  },

  transformer: function (transformer, args) {
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
