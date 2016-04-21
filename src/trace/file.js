var assign = require('lodash/object/assign');
var cache = require('../cache');
var fs = require('fs');
var match = require('../match');
var path = require('path');
var resolve = require('../resolve');
var Vinyl = require('vinyl');

function isValidImport (imp) {
  return imp.indexOf('\'') === -1 && imp.indexOf('"') === -1;
}

function trace (vinyl, opts) {
  opts = assign({
    traced: []
  }, opts);

  var importCache = cache.data('imports');
  var matchCache = cache.data('matches');
  var matches = matchCache[vinyl.path] || (matchCache[vinyl.path] = match(vinyl, opts));

  opts.traced.push(vinyl.path);
  vinyl.imports = matches.filter(isValidImport).map(function (imp) {
    var impPath = resolve(imp, assign(opts, { relativeTo: vinyl.path }));

    if (importCache[impPath]) {
      //return importCache[impPath];
    }

    if (!fs.existsSync(impPath)) {
      throw new Error('cannot trace "' + vinyl.path + '" because "' + impPath + '" does not exist');
    }

    var stat = fs.statSync(impPath);
    if (stat.isDirectory()) {
      throw new Error('cannot trace "' + vinyl.path + '" because "' + impPath + '" is a directory');
    }

    return importCache[impPath] = {
      contents: new Buffer(fs.readFileSync(impPath)),
      path: impPath,
      value: imp
    };
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
