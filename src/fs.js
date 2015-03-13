'use strict';

var fs = require('fs');
var path = require('path');

function Fs () {
  this._map = {};
}

Fs.prototype = {
  ext: function (file, ext, exts) {
    exts = exts || [ext];
    return exts.indexOf((path.extname(file) || '.').split('.')[1]) === -1 ? file + '.' + ext : file;
  },

  map: function (map, path) {
    if (typeof map === 'object') {
      for (var a in map) {
        if (map.hasOwnProperty(a)) {
          this._map[a] = map[a];
        }
      }
    } else {
      this._map[map] = path;
    }

    return this;
  },

  module: function (mod, relativeTo) {
    if (mod.indexOf(path.sep) !== -1) {
      return;
    }

    var foundFile;
    var dirs = __dirname.split(path.sep);
    var lookups = {
      'bower_components': 'bower.json',
      'node_modules': 'package.json'
    };
    relativeTo = relativeTo ? path.dirname(relativeTo) : process.cwd();

    check:
    for (var a = 0; a < dirs.length; a++) {
      for (var b in lookups) {
        if (lookups.hasOwnProperty(b)) {
          var checkDir = path.join(relativeTo, new Array(a).join('../'), b, mod);
          var packageFile = path.join(checkDir, lookups[b]);

          if (fs.existsSync(packageFile)) {
            var pkg = require(packageFile);
            var pkgMain = path.join(checkDir, pkg.main);

            if (pkg.main && fs.existsSync(pkgMain)) {
              foundFile = pkgMain;
              break check;
            }
          }
        }
      }
    }

    return foundFile;
  },

  resolve: function (file, relativeTo) {
    return (this._map[file] && path.resolve(this._map[file])) ||
      (path.isAbsolute(file) && file) ||
      this.module(file, relativeTo) ||
      this.relative(file, relativeTo);
  },

  relative: function (file, relativeTo) {
    return relativeTo ? path.resolve(path.dirname(relativeTo), file) : path.resolve(file);
  }
};

module.exports = Fs;
