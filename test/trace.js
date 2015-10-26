'use strict';

var fs = require('fs');
var mocha = require('mocha');
var trace = require('../src/trace');
var tmp = require('tmp');
var vinylFs = require('vinyl-fs');

mocha.describe('trace', function () {
  function createReadStream (contents) {
    var file = tmp.fileSync({ postfix: '.js' });
    fs.writeFileSync(file.name, contents);
    return vinylFs.src(file.name);
  }

  function createWriteStream () {
    return vinylFs.dest(tmp.fileSync().name);
  }

  mocha.it('should not error if code has JSX', function (done) {
    var stream = createReadStream('<jsx />');
    stream.on('end', done);
    stream.pipe(trace());
    stream.pipe(createWriteStream());
  });
});
