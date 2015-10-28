var assign = require('lodash/object/assign');
var fs = require('fs');
var match = require('../match');
var path = require('path');
var resolve = require('../resolve');
var Vinyl = require('vinyl');

function trace (vinyl, opts) {
  opts = assign({
    files: [],
    traced: [],
    vinyls: []
  }, opts);

  // Metadata.
  vinyl.imports = [];
  match(vinyl, opts).forEach(function (imp) {
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
      trace(impVinyl, assign(opts, {
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

module.exports = function (file, opts) {
  return trace(new Vinyl({
    contents: fs.readFileSync(file),
    path: path.resolve(file)
  }), opts);
};
