'use strict';

var Bundle = require('./src/bundle');
var EventEmitter = require('events').EventEmitter;
var File = require('./src/file');
var Fs = require('./src/fs');
var Matcher = require('./src/matcher/all');
var Tracer = require('./src/tracer');
var Transformer = require('./src/transformer');
var Watcher = require('./src/watcher');
var ubercod = require('ubercod');
var dependencies = {
  $Bundle: Bundle,
  Events: EventEmitter,
  Fs: Fs,
  Matcher: Matcher,
  Tracer: Tracer,
  Transformer: Transformer,
  Watcher: Watcher
};

module.exports = ubercod(function () {
  return ubercod(dependencies);
}, dependencies);
