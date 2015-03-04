'use strict';

var EventEmitter = require('events').EventEmitter;
var extend = require('extend');
var fs = require('fs');
var GalvatronBundle = require('./src/bundle');
var GalvatronFile = require('./src/file');
var GalvatronTracer = require('./src/tracer');
var GalvatronWatcher = require('./src/watcher');
var path = require('path');
var transformBabel = require('./src/transform/babel');
var transformGlobalize = require('./src/transform/globalize');
var transformUnamd = require('./src/transform/unamd');
var util = require('util');

function resolveModule (mod) {
  var modFile = mod + '.js';
  var foundFile;
  var dirs = __dirname.split(path.sep);
  var lookups = {
    'bower_components': 'bower.json',
    'node_modules': 'package.json'
  };

  check:
  for (var a = 0; a < dirs.length; a++) {
    for (var b in lookups) {
      if (lookups.hasOwnProperty(b)) {
        var checkDir = path.join(__dirname, new Array(a).join('../'), b, mod);
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
          var pkgMain = path.join(checkDir, pkg.main);

          if (pkg.main && fs.existsSync(pkgMain)) {
            foundFile = pkgMain;
            break check;
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
}

function Galvatron (options) {
  options = options || {};
  options = {
      duplicate: options.duplicate || false,
      joiner: '\n\n'
  };

  EventEmitter.call(this);
  this.options = options;
  this.reset();
}

util.inherits(Galvatron, EventEmitter);
extend(Galvatron.prototype, {
    bundle: function (paths, options) {
      return new GalvatronBundle(this, paths, options);
    },

    clean: function () {
      this._fileCache = {};
      this._resolveCache = {};
      return this;
    },

    file: function (file) {
      var resolved = this.resolve(file);
      return this._fileCache[resolved] || (this._fileCache[resolved] = new GalvatronFile(this, resolved));
    },

    map: function (map, path) {
      if (typeof map === 'object') {
        for (var a in map) {
          if (map.hasOwnProperty(a)) {
            this._resolveCache[a] = map[a];
          }
        }
      } else {
        this._resolveCache[map] = path;
      }

      return this;
    },

    pre: function (transformer) {
      return this.transformer('pre', transformer);
    },

    post: function (transformer) {
      return this.transformer('post', transformer);
    },

    reset: function () {
      this.clean();
      this._transformers = { pre: [], post: [] };
      return this;
    },

    resolve: function (file, to) {
      if (path.isAbsolute(file)) {
        return file;
      }

      if (file.indexOf(path.sep) === -1) {
        return this._resolveCache[file] || (this._resolveCache[file] = resolveModule(file));
      }

      if (['.js', '.json'].indexOf(path.extname(file))) {
        file += '.js';
      }

      return to ? path.resolve(path.dirname(to), file) : file;
    },

    tracer: function () {
      return new GalvatronTracer(this);
    },

    transformer: function (type, transformer) {
      if (typeof transformer === 'string') {
        transformer = this.constructor.transform[transformer];
      }

      if (typeof transformer !== 'function') {
        throw new Error('Transformer must be a function.');
      }

      this._transformers[type].push(transformer);
      return this;
    },

    watch: function (paths) {
      return new GalvatronWatcher(this, paths);
    },

    _transform: function (type, file, data) {
      var that = this;
      this._transformers[type].forEach(function (transformer) {
        data = transformer(that, file, data);
      });
      return data;
    },
});

Galvatron.transform = {
    babel: transformBabel,
    globalize: transformGlobalize,
    unamd: transformUnamd
};

module.exports = Galvatron;
