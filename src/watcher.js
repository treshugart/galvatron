'use strict';

var fs = require('fs');
var gulpTap = require('gulp-tap');
var gulpWatch = require('gulp-watch');
var path = require('path');
var Vinyl = require('vinyl');

var streams = {};
var updated = {};
var watched = {};

module.exports = function (galv, glob) {
  var watcher = gulpWatch(glob, function (file) {
    var parent = file.path;

    galv.emit('update', file.path);

    // Once it's being watched, we don't need to execute any logic. This watcher
    // exists solely to build a list of main files that we need to rebuild.
    if (watched[parent]) {
      return;
    }

    watched[parent] = true;
    galv.trace(file.path).forEach(function (traced) {
      // Don't need to do anything if this is the main file because the main
      // watcher will do what we need it to.
      if (file.path === traced.path) {
        return;
      }

      // Individual watchers don't need to be re-created.
      if (streams[traced.path]) {
        return;
      }

      streams[traced.path] = gulpWatch(traced.path, function () {
        // If we don't uncache it then the file won't change and no new files
        // will be picked up.
        traced.clean();

        // We actually have to write the main file to trigger a change.
        fs.readFile(parent, function (err, buf) {
          fs.writeFile(parent, buf.toString(), function () {
            galv.emit('update', traced.path);
          });
        });
      });
    });
  });

  watcher.on('close', function () {
    Object.keys(streams).forEach(function (name) {
      streams[name].unwatch();
      streams[name].close();
      delete streams[name];
    });
  });

  return watcher;
};
