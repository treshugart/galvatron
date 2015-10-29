var assign = require('lodash/object/assign');
var cache = require('../cache');
var fs = require('fs');
var match = require('../match');
var path = require('path');
var resolve = require('../resolve');
var Vinyl = require('vinyl');

function trace (vinyl, opts) {
  opts = assign({
    traced: []
  }, opts);

  var traceCache = cache.data('trace');
  opts.traced.push(vinyl.path);

  vinyl.imports = vinyl.imports || match(vinyl, opts).map(function (imp) {
    var impPath = resolve(imp, assign(opts, { relativeTo: vinyl.path }));

    if (traceCache[impPath]) {
      return traceCache[impPath];
    }

    if (!fs.existsSync(impPath)) {
      throw new Error('cannot trace "' + vinyl.path + '" because "' + impPath + '" does not exist');
    }

    return traceCache[impPath] = new Vinyl({
      contents: new Buffer(fs.readFileSync(impPath)),
      path: impPath,
      value: imp
    });
  });

  return vinyl.imports.reduce(function (dep, imp) {
    // If there are circular references, this will cause recursion. We ignore
    // recursion since all we care about is a list of dependencies.
    if (opts.traced.indexOf(imp.path) === -1) {
      opts.traced.push(imp.path);
      dep = dep.concat(trace(imp, opts));
    }
    return dep;
  }, []).concat(vinyl);
}

module.exports = function (file, opts) {
  return trace(new Vinyl({
    contents: fs.readFileSync(file),
    path: path.resolve(file)
  }), opts);
};
