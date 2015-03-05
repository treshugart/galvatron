'use strict';

function Transformer () {
  this._transformers = {
    pre: [],
    post: []
  };
}

Transformer.prototype = {
  pre: function (transformer) {
    return this.transformer('pre', transformer, [].slice.call(arguments, 1));
  },

  post: function (transformer) {
    return this.transformer('post', transformer, [].slice.call(arguments, 1));
  },

  transform: function (type, data, info) {
    this._transformers[type].forEach(function (transformer) {
      data = transformer(data, info);
    });
    return data;
  },

  transformer: function (type, transformer, args) {
    if (typeof transformer === 'string') {
      transformer = require('./transform/' + transformer).apply(null, args);
    }

    if (typeof transformer !== 'function') {
      throw new Error('Transformer must be a function.');
    }

    this._transformers[type].push(transformer);
    return this;
  }
};

module.exports = Transformer;
