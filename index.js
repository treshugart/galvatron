'use strict';

var Bundle = require('./src/bundle');
var EventEmitter = require('events').EventEmitter;
var File = require('./src/file');
var Fs = require('./src/fs');
var matcher = require('./src/matcher/js');
var Reporter = require('./src/reporter');
var Tracer = require('./src/tracer');
var Transformer = require('./src/transformer');
var Watcher = require('./src/watcher');
var ubercod = require('ubercod');
var dependencies = {
  $Bundle: Bundle,
  Events: EventEmitter,
  $File: File,
  Fs: Fs,
  matcher: matcher,
  Reporter: Reporter,
  Tracer: Tracer,
  Transformer: Transformer,
  Watcher: Watcher
};

module.exports = ubercod(function () {
  return ubercod(dependencies);
}, dependencies);
