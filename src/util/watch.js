'use strict';

var glob = require('glob');
var gulpWatch = require('gulp-watch');

// Wraps the stream's pipe() method so that it passes on the "continue" event
// to the next stream in the pipe. When "continue" is triggered on the original
// watch stream all streams that have subsequently been piped will emit this
// event allowing anything to add a listener to the last stream in the pipe
// without that listener having to know about the watch stream.
function wrapPipe (stream) {
  var oldPipe = stream.pipe;
  stream.pipe = function (innerStream) {
    var that = this;
    wrapPipe(innerStream).on('continue', function () {
      that.emit('continue');
    });
    oldPipe.call(this, innerStream);
    return this;
  };
  return stream;
}

// Creates a gulp-watch stream and wraps it so that it keeps track of the
// initial processing of files. Once the initial processing is complete it
// fires a "complete" event. This allows the initial processing of the big
// glob of source files to complete before the next stream in the pipe is
// processed. All subsequent runs are handled normally.
module.exports = function watch (src, callback) {
  var isFirstRun = true;
  var files = glob(src);
  var processed = [];
  var stream = gulpWatch(src, function (vinyl) {
    var vinylPath = vinyl.path;

    // Just in case the file has been run through the stream twice. This
    // shouldn't be an issue, but if an intermediate stream adds files to
    // the stream and one is added twice it could cause us to be wrong.
    if (processed.indexOf(vinylPath) === -1) {
      processed.push(vinylPath);
    }

    // If we're done with the first run we fire a custom event that can
    // tell something watching for it that the watch stream can continue.
    if (isFirstRun && files.length === processed.length) {
      isFirstRun = false;
      stream.emit('continue');
    }

    // Proxy the callback.
    if (callback) {
      callback(vinyl);
    }
  });

  wrapPipe(stream);
  return stream;
};
