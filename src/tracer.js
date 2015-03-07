'use strict';

var glob = require('./glob');

function Tracer ($events, $fs) {
  this._events = $events;
  this._fs = $fs;
}

Tracer.prototype = {
  trace: function (paths) {
    var that = this;
    var traced = [];

    glob(paths).forEach(function (file) {
      that._traceRecursive(file).forEach(function (dependency) {
        traced.push(dependency);
      });
    });

    return traced;
  },

  _traceRecursive: function (file, parent, files, depth) {
    var that = this;
    var cached;

    parent = parent || null;
    files = files || [];
    depth = depth || 0;
    file = this._fs.relative(file, parent);
    cached = this._fs.cached(file);
    file = cached || this._fs.file(file);

    this._events.emit('trace', file.path, depth);
    cached || this._events.emit('trace.new', file.path, depth);

    file.dependencies.forEach(function (dependency) {
      that._traceRecursive(dependency, file.path, files, depth + 1);
    });

    if (files.indexOf(file) === -1) {
      files.push(file);
    }

    return files;
  }
};

module.exports = Tracer;
