var cache = require('./cache');
var gulp = require('gulp');

module.exports = function (pattern, task) {
  task();
  gulp.watch(pattern, function (f) {
    cache.expire(f.path);
    task();
  });
};
