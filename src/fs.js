'use strict';

var fs = require('fs');
var path = require('path');

function Fs () {
  this._map = {};
}

Fs.prototype = {
  ext: function (file, defaultExt, validExts) {
    var fileExt = (path.extname(file) || '.').split('.')[1];
    validExts = validExts || [defaultExt];
    return validExts.indexOf(fileExt) === -1 ?
      file + '.' + defaultExt :
      file;
  },

  lookups: {
    'bower_components': 'bower.json',
    'node_modules': 'package.json'
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

  module: function (request, relativeTo) {
    var mod;
    if (request.indexOf(path.sep) !== -1) {
      // the request is a deep lookup like `require('foo/bar/baz')`
      // use 'foo' as the module and save the rest ('bar/baz')
      // for later.
      var split = request.split(path.sep);
      mod = split.shift();
      request = split.join(path.sep);
    } else {
      mod = request;
      request = '';
    }

    relativeTo = relativeTo ? path.dirname(relativeTo) : process.cwd();
    var dirs = relativeTo.split(path.sep);
    var foundFile;

    dirs:
    for (var a = 0; a < dirs.length; a++) {
      lookups:
      for (var b in this.lookups) {
        if (!this.lookups.hasOwnProperty(b)) {
          continue lookups;
        }

        var basePath = path.join(relativeTo, new Array(a).join('../'));
        var modulePath = path.join(basePath, b, mod);
        var moduleFile = path.join(modulePath, request);
        var indexFile = path.join(basePath, 'index.js');
        var packageFile = path.join(modulePath, this.lookups[b]);

        if (request && fs.existsSync(moduleFile)) {
          // this is a deep lookup into the package,
          // resolve with that if the directory exists
          foundFile = moduleFile
          break dirs;
        }

        if (fs.existsSync(indexFile)) {
          foundFile = indexFile;
          break dirs;
        }

        if (fs.existsSync(packageFile)) {
          var pkg = require(packageFile);

          if (pkg.main) {
            // otherwise, return the module's main entry point.
            var pkgMain = path.join(modulePath, pkg.main);

            if (fs.existsSync(pkgMain)) {
              foundFile = pkgMain;
              break dirs;
            }

            pkgMain = pkgMain + '.js';

            if (fs.existsSync(pkgMain)) {
              foundFile = pkgMain;
              break dirs;
            }
          }
        }
      }
    }

    return foundFile;
  },

  expand: function (file) {
    if (this._map[file]) {
      // return early for an exact match
      return path.resolve(this._map[file]);
    }

    for (var alias in this._map) {
      if (this._map.hasOwnProperty(alias)) {
        if (file.indexOf(alias) === 0) {
          // the file path begins with the alias, exchange that
          // for the expanded path
          return path.resolve(file.replace(alias, this._map[alias]));
        }
      }
    }

    return file;
  },

  resolve: function (file, relativeTo) {
    file = this.expand(file);

    if (path.isAbsolute(file)) {
      return file;
    }

    return this.module(file, relativeTo) || this.relative(file, relativeTo);
  },

  relative: function (file, relativeTo) {
    return relativeTo ? path.resolve(path.dirname(relativeTo), file) : path.resolve(file);
  }
};

module.exports = Fs;
