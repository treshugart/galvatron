'use strict';

var glob = require('./util/glob');

function Tracer ($events, $file, $fs) {
  this._events = $events;
  this._file = $file;
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

  _traceRecursive: function (file, parent, files, traced, depth) {
    var that = this;

    parent = parent || null;
    files = files || [];
    traced = traced || [];
    depth = depth || 0;
    file = this._file(this._fs.resolve(file, parent));

    this._events.emit('trace', file.path, depth);
    file.imports.forEach(function (imp) {
      // If there are circular references, this will cause recursion. We ignore
      // recursion since all we care about is a list of dependencies.
      if (traced.indexOf(imp.path) === -1) {
        traced.push(imp.path);
        that._traceRecursive(imp.path, file.path, files, traced, depth + 1);
      }
    });

    if (files.indexOf(file) === -1) {
      files.push(file);
    }

    return files;
  }
};

module.exports = Tracer;
