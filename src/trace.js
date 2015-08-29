var assign = require('lodash/object/assign');
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

  match(vinyl).forEach(function (imp) {
    var impVinyl = new Vinyl({
      path: resolve(imp, assign(opts, {
        relativeTo: vinyl.path
      }))
    });

    impVinyl.value = imp;

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
      that.unshift(subVinyl);
    });
    return callback();
  });
};
