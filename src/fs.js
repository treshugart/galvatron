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

  // Resolves a module file based on the following semantics an in order:
  // - If a relative path is given:
  //   - ./path/to/module-name/index.js
  //   - ./path/to/module-name.js
  // - If only a module name is given:
  //   - [module-folder]/[module-name]/[module-file].json "main"
  //   - [module-folder]/[module-name]/index.js
  // - If a module name and path is given:
  //   - [module-folder]/[module-name]/path/index.js
  //   - [module-folder]/[module-name]/path.js
  module: function (file, relativeTo) {
    var fileIndex;

    if (path.isAbsolute(file)) {
      return;
    }

    if (file[0] === '.') {
      file = this.relative(file, relativeTo) + '.js';
      fileIndex = path.join(file, 'index.js');
      return fs.existsSync(fileIndex) ? fileIndex : file;
    }

    var currentDir = relativeTo ? path.dirname(relativeTo) : process.cwd();
    var dirs = currentDir.split(path.sep);
    var isModuleNameOnly = file.indexOf(path.sep) === -1;

    for (var a = 0; a < dirs.length; a++) {
      for (var lookupPath in this.lookups) {
        var lookupBase = path.join(currentDir, new Array(a).join('../'));
        var lookupFile = path.join(lookupBase, lookupPath, file, this.lookups[lookupPath]);
        var lookupModule = path.join(lookupBase, lookupPath, file + '.js');
        var lookupModuleIndex = path.join(lookupBase, lookupPath, file, 'index.js');

        if (isModuleNameOnly && fs.existsSync(lookupFile)) {
          var json = require(lookupFile);
          if (json.main) {
            return this.resolve(json.main, lookupFile);
          }
        }

        if (fs.existsSync(lookupModuleIndex)) {
          return lookupModuleIndex;
        }

        if (fs.existsSync(lookupModule)) {
          return lookupModule;
        }
      }
    }
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
