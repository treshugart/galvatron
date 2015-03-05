'use strict';

var extend = require('extend');
var Bundle = require('./src/bundle');
var Fs = require('./src/fs');
var Tracer = require('./src/tracer');
var Transformer = require('./src/transformer');

function Galvatron () {
  this.transformer = new Transformer();
  this.fs = new Fs(this.transformer);
  this.tracer = new Tracer(this.fs);
}

Galvatron.prototype = {
    bundle: function (paths, options) {
      return new Bundle(this.tracer, paths, options);
    }
};

module.exports = Galvatron;
