'use strict';

var fs = require('fs');
var gulpWatch = require('gulp-watch');
var Tracer = require('./tracer');

var streams = {};
var watched = {};

function Watcher (events, tracer) {
  this._events = events;
  this._tracer = tracer;
}

Watcher.prototype = {
  watch: function (glob) {
    var that = this;
    var watcher = gulpWatch(glob, function (file) {
      var parent = file.path;

      // Once it's being watched, we don't need to execute any logic. This watcher
      // exists solely to build a list of main files that we need to rebuild.
      if (watched[parent]) {
        return;
      }

      watched[parent] = true;
      that._tracer.trace(file.path).forEach(function (traced) {
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
          that._events.emit('watch.update', traced);
          fs.readFile(parent, function (err, buf) {
            fs.writeFile(parent, buf.toString());
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
  }
};

module.exports = Watcher;
