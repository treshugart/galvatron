var globAll = require('glob-all');
var gulpFilter = require('gulp-filter');
var gulpTap = require('gulp-tap');
var minimatch = require('minimatch');
var through = require('through2');
var trace = require('./trace/file');
var vinylFs = require('vinyl-fs');

function createVinylFs (traced) {
  return function () {
    return vinylFs.src(Object.keys(traced)).pipe(gulpTap(function (file) {
      file.imports = traced[file.path].imports;
      file.origin = traced[file.path].origin;
    }));
  };
}

function createFilter (traced) {
  return function () {
    var args = [].slice.call(arguments);
    var f = gulpFilter(function (file) {
      return args.some(function (opts) {
        var pass = true;
        var path = file.path;
        var tracedFile = traced[path];

        // We can't pass a file if we haven't traced it.
        if (!tracedFile) {
          return false;
        }

        if (pass && opts.common) {
          pass = tracedFile.origin.length > 1;
        }

        if (pass && opts.origin) {
          pass = tracedFile.origin.some(function (orig) {
            return minimatch(orig, opts.origin);
          });
        }

        if (pass && opts.unique) {
          pass = tracedFile.origin.length === 1;
        }

        return pass;
      });
    }, {
      restore: true
    });
    this._filters = (this.filters || []).concat(f);
    return f;
  };
}

function restore () {
  if (!this._filters || !this._filters.length) {
    throw new Error('Cannot restore the last filter because no filters exist.');
  }
  return this._filters.pop().restore;
}

module.exports = function (src, opts) {
  // The original files passed in, if specified.
  var origin = globAll.sync(src);

  // Pre-trace all files so we know what we're dealing with. If no path was
  // specified, then this is empty.
  var traced = origin.reduce(function (map, orig) {
    return trace(orig, opts).reduce(function (map, dep) {
      if (map[dep.path]) {
        map[dep.path].origin.push(orig);
      } else {
        dep.origin = [orig];
        map[dep.path] = dep;
      }
      return map;
    }, map);
  }, {});

  // The stream that inserts the traced files into the stream.
  var stream = through.obj(function (file, type, func) {
    var that = this;
    Object.keys(traced).forEach(function (file) {
      that.push(traced[file]);
    });
    return func();
  });

  stream.createStream = createVinylFs(traced);
  stream.filter = createFilter(traced);
  stream.restore = restore;
  stream.src = src;

  return stream;
};
