'use strict';

var fs = require('fs');
var gulpWatch = require('gulp-watch');

function Watcher ($events, $file, $tracer) {
  this._events = $events;
  this._file = $file;
  this._tracer = $tracer;
}

Watcher.prototype = {
  watch: function (bundle, callback) {
    var that = this;
    var subWatcher = gulpWatch(bundle.all, function (bundleFile) {
      bundleFile = bundleFile.path;

      // If we don't uncache it then the file won't change and no new files
      // will be picked up.
      that._file(bundleFile).expire();

      // We actually have to write the main file to trigger a change.
      bundle.destinations(bundleFile).forEach(function (mainFile) {
        // If a bundle file was updated, then we don't need to force update
        // it. We just notify that it's been updated.
        if (bundle.files.indexOf(bundleFile) > -1) {
          that._events.emit('update.main', bundleFile);
        } else {
          // Force update the main file
          fs.readFile(mainFile, function (err, buf) {
            fs.writeFile(mainFile, buf.toString(), function () {
              that._events.emit('update', bundleFile, mainFile);
              callback && callback(bundleFile, mainFile);
            });
          });
        }
      });
    });

    subWatcher.on('error', function (error) {
      that._events.emit('error', error);
    });

    subWatcher.on('close', function () {
      subWatcher.unwatch();
      subWatcher.close();
    });

    subWatcher.on('error', function (error) {
      that._events.emit('error', error);
    });

    return subWatcher;
  }
};

module.exports = Watcher;