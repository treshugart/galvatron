'use strict';

var extend = require('extend');
var Watcher = require('./watcher');
var glob = require('./glob');
var mapStream = require('map-stream');
var minimatch = require('minimatch');
var vinylTransform = require('vinyl-transform');

function transform (files) {
  return files.map(function (file) {
    return file.post;
  });
}

function Bundle (tracer, paths, options) {
  this._options = extend({
    common: false,
    joiner: '\n\n'
  }, options);
  this._paths = paths;
  this._tracer = tracer;
}

Bundle.prototype = {
  common: function () {
    return this._concatenate(this._getDependencies().common);
  },

  uncommon: function () {
    return this._concatenate(this._getDependencies().uncommon);
  },

  generate: function (paths) {
    var that = this;
    var common = this._getDependencies().common;
    var files = this._getFiles();
    var opts = this._options;
    var traced = [];

    glob(paths).forEach(function (file) {
      // Only allow files that are defined in the bundle.
      if (files.indexOf(file) === -1) {
        return;
      }

      // Prepend the common dependencies if our option matches the file.
      if (typeof opts.common === 'string' && minimatch(file, opts.common)) {
        traced = traced.concat(common);
      }

      // Trace each dependency and only add them to the common array if they
      // aren't in there so that there are no duplicates.
      that._tracer.trace(file).forEach(function (dependency) {
        if (common.indexOf(dependency) === -1) {
          traced.push(dependency);
        }
      });
    });

    return this._concatenate(traced);
  },

  stream: function () {
    var that = this;
    return vinylTransform(function (file) {
      return mapStream(function (data, next) {
        return next(null, that.bundle(file));
      });
    });
  },

  watch: function () {
    return new Watcher(this._tracer, this._paths);
  },

  _concatenate: function (files) {
    return transform(files).join(this._options.joiner);
  },

  _getDependencies: function () {
    var that = this;
    var traced = this._tracer.trace(this._paths);
    var common = [];

    // Find duplicate files.
    var tracedDuplicates = traced.filter(function (value, index, self) {
      return self.indexOf(value) !== index;
    });

    // Find unique files.
    var tracedUniques = traced.filter(function (value, index, self) {
      return self.indexOf(value) === index;
    });

    // Ensure duplicate file dependencies are included and removed from unique.
    tracedDuplicates.forEach(function (duplicateFile) {
      that._tracer.trace(duplicateFile.path).forEach(function (duplicateFileDependency) {
        var indexInTracedDuplicates = common.indexOf(duplicateFileDependency);
        var indexInTracedUniques = tracedUniques.indexOf(duplicateFileDependency);

        if (indexInTracedDuplicates === -1) {
          common.push(duplicateFileDependency);
        }

        if (indexInTracedUniques !== -1) {
          tracedUniques.splice(indexInTracedUniques, 1);
        }
      });
    });

    return {
      common: common,
      uncommon: tracedUniques
    };
  },

  _getFiles: function () {
    return glob(this._paths);
  }
};

module.exports = Bundle;
