'use strict';

var out = process.stdout;
var path = require('path');
var supportsExtendedStdoutMethods = !!out.clearLine;

function relative (file) {
  return path.relative(process.cwd(), file);
}

module.exports = function (events) {
  events
    .on('compile', function (file, index, traced, bundle) {
      var dest = bundle.map(relative).join(', ');
      var num = index + 1;
      var total = traced.length;
      var percent = Math.round((num / total) * 100);

      if (supportsExtendedStdoutMethods) {
        out.clearLine();
        out.cursorTo(0);
      }

      // This will print out once for every line if extended stdout methods
      // are not supported. Should work fine in Mac.
      out.write('Compiling ' + dest + ': ' + num + ' of ' + total + ' files (' + percent + '%)');

      if (!supportsExtendedStdoutMethods || index === traced.length -1) {
        out.write('\n');
      }
    })
    .on('error', function (error, file) {
      if (file) {
        console.error('ERROR %s: %s', relative(file), error);
      } else {
        console.error('ERROR %s', error);
      }
    })
    .on('update', function (file, main) {
      console.log('UPDATE %s -> %s', relative(file), relative(main));
    });
};
