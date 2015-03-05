'use strict';

var Bundle = require('./src/bundle');
var EventEmitter = require('events').EventEmitter;
var File = require('./src/file');
var Fs = require('./src/fs');
var Tracer = require('./src/tracer');
var Transformer = require('./src/transformer');
var Watcher = require('./src/watcher');
var ubercod = require('ubercod');

module.exports = function () {
  return ubercod({
    Bundle: Bundle,
    $Events: EventEmitter,
    File: File,
    $Fs: Fs,
    $Tracer: Tracer,
    $Transformer: Transformer,
    $Watcher: Watcher
  });
};
