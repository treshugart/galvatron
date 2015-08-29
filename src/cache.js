var minimatch = require('minimatch');
var tap = require('gulp-tap');
var ternary = require('ternary-stream');
var through = require('through2');
var _cache = {};

function cache (key, plugin) {
  if (!_cache[key]) {
    _cache[key] = {};
  }

  plugin.on('data', function (file) {
    _cache[key][file.path] = file.contents;
  });

  return ternary(function (file) {
    return _cache[key][file.path];
  }, through.obj(function (file, type, done) {
    file.contents = _cache[key][file.path];
    done(null, file);
  }), plugin);
}

cache.expire = function (pattern) {
  Object.keys(_cache).forEach(function (key) {
    Object.keys(_cache[key]).forEach(function (path) {
      if (minimatch(path, pattern)) {
        delete _cache[key][path];
      }
    });
  });
  return this;
};

module.exports = cache;
