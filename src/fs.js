'use strict';

var File = require('./file');
var fs = require('fs');
var path = require('path');

function Fs ($matcher, $transformer) {
  this._cache = {};
  this._map = {};
  this._matcher = $matcher;
  this._transformer = $transformer;
}

Fs.prototype = {
  cached: function (file) {
    return this._cache[this.resolve(file)];
  },

  file: function (file) {
    var resolved = this.resolve(file);
    return this._cache[resolved] || (this._cache[resolved] = new File(this, this._matcher, this._transformer, resolved));
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
    if (this._map[mod]) {
      return this._map[mod];
    }

    var modFile = mod + '.js';
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
          var found = false;
          var defaultFiles = [
            'index.js',
            modFile,
            path.join('src', 'index.js'),
            path.join('src', modFile),
            path.join('lib', 'index.js'),
            path.join('lib', modFile),
            path.join('dist', 'index.js'),
            path.join('dist', modFile)
          ];

          if (fs.existsSync(packageFile)) {
            var pkg = require(packageFile);
            if (pkg.main) {
                var pkgMain = path.join(checkDir, pkg.main);
                if (fs.existsSync(pkgMain)) {
                  foundFile = pkgMain;
                  break check;
                }
            }
          }

          found = defaultFiles.some(function (file) {
            file = path.join(checkDir, file);
            if (fs.existsSync(file)) {
              foundFile = file;
              return true;
            }
          });

          if (found) {
            break check;
          }
        }
      }
    }

    if (!foundFile) {
      throw new Error('Could not find the module ' + mod + '.');
    }

    return foundFile;
  },

  resolve: function (file, relativeTo) {
    if (path.isAbsolute(file)) {
      return file;
    }

    if (file.indexOf(path.sep) === -1) {
      return path.resolve(this.module(file, relativeTo));
    }

    if (['.js', '.json'].indexOf(path.extname(file)) === -1) {
      file += '.js';
    }

    return this.relative(file, relativeTo);
  },

  relative: function (file, relativeTo) {
    return relativeTo ? path.resolve(path.dirname(relativeTo), file) : path.resolve(file);
  }
};

module.exports = Fs;
