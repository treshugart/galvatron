'use strict';

var glob = require('./glob');

function Tracer (fs) {
  this._fs = fs;
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

    parent = parent || null;
    files = files || [];
    depth = depth || 0;
    file = this._fs.file(file);

    file.dependencies.forEach(function (dependency) {
      that._traceRecursive(dependency, file.path, files, depth + 1);
    });

    files.push(file);

    return files;
  }
};

module.exports = Tracer;
