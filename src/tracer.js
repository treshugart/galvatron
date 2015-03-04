'use strict';

var glob = require('glob');

function eachFileInPaths (paths, fn) {
  if (typeof paths === 'string') {
    paths = [paths];
  }

  paths.forEach(function (path) {
    glob.sync(path).forEach(fn);
  });
}

function Tracer (galv) {
  this._galv = galv;
}

Tracer.prototype = {
  trace: function (paths) {
    var galv = this._galv;
    var that = this;
    var traced = [];

    eachFileInPaths(paths, function (file) {
      galv.emit('trace.start', file);
      that._traceRecursive(file).forEach(function (dependency) {
        traced.push(dependency);
      });
      galv.emit('trace.stop', file);
    });

    return traced;
  },

  _traceRecursive: function (file, parent, files, depth) {
    var galv = this._galv;
    var that = this;

    parent = parent || null;
    files = files || [];
    depth = depth || 0;
    file = galv.file(file);

    galv.emit('trace.file', file, depth);
    file.dependencies.forEach(function (dependency) {
      that._traceRecursive(dependency, file.path, files, depth + 1);
    });

    files.push(file);

    return files;
  }
};

module.exports = Tracer;
