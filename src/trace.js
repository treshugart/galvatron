var assign = require('lodash/object/assign');
var fs = require('fs');
var match = require('./match');
var resolve = require('./resolve');
var through = require('through2');
var Vinyl = require('vinyl');

function traceRecursive (vinyl, opts) {
  opts = assign({
    files: [],
    traced: [],
    vinyls: []
  }, opts);

  // Metadata.
  vinyl.imports = [];
  match(vinyl).forEach(function (imp) {
    var impPath = resolve(imp, assign(opts, { relativeTo: vinyl.path }));

    if (!fs.existsSync(impPath)) {
      throw new Error('cannot trace "' + vinyl.path + '" because "' + impPath + '" does not exist');
    }

    var impVinyl = new Vinyl({
      contents: new Buffer(fs.readFileSync(impPath)),
      path: impPath
    });

    // Metadata.
    vinyl.imports.push({
      path: impPath,
      value: imp
    });

    // If there are circular references, this will cause recursion. We ignore
    // recursion since all we care about is a list of dependencies.
    if (opts.traced.indexOf(impVinyl.path) === -1) {
      opts.traced.push(impVinyl.path);
      traceRecursive(impVinyl, assign(opts, {
        files: opts.files,
        traced: opts.traced,
        vinyls: opts.vinyls
      }));
    }
  });

  if (opts.files.indexOf(vinyl.path) === -1) {
    opts.files.push(vinyl.path);
    opts.vinyls.push(vinyl);
  }

  return opts.vinyls;
}

module.exports = function (opts) {
  return through.obj(function (vinyl, enc, callback) {
    var that = this;
    traceRecursive(vinyl, opts).forEach(function (subVinyl) {
      that.push(subVinyl);
    });
    return callback();
  });
};
