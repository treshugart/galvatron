var minimatch = require('minimatch');
var ternary = require('ternary-stream');
var through = require('through2');

var internalCache = {};

function cache (key, plugin) {
  var val = cache.data(key);

  plugin.on('data', function (file) {;
    val[file.path] = file.contents;
  });

  return ternary(function (file) {
    return val[file.path];
  }, through.obj(function (file, type, done) {
    file.contents = val[file.path];
    done(null, file);
  }), plugin);
}

cache.data = function (key) {
  return internalCache[key] || (internalCache[key] = {});
};

cache.expire = function (pattern) {
  // Also accept an object with a pather property. This supports:
  // - a vinyl file
  // - a gaze event
  // - anything that has the "path" property set
  if (typeof pattern === 'object') {
    pattern = pattern.path;
  }

  Object.keys(internalCache).forEach(function (key) {
    var item = internalCache[key];
    Object.keys(item).forEach(function (path) {
      if (minimatch(path, pattern)) {
        delete item[path];
      }
    });
  });

  return this;
};

module.exports = cache;
