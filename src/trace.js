var glob = require('./util/glob');
var match = require('./match');
var resolve = require('./resolve');

function traceRecursive (file, opts, parent, files, traced) {
  opts = opts || {};

  var filePath = resolve(file, opts);
  var imports = match(filePath);

  parent = parent || null;
  files = files || [];
  traced = traced || [];

  imports.forEach(function (imp) {
    var impPath = resolve(imp);

    // If there are circular references, this will cause recursion. We ignore
    // recursion since all we care about is a list of dependencies.
    if (traced.indexOf(impPath) === -1) {
      traced.push(impPath);
      traceRecursive(impPath, opts, filePath, files, traced);
    }
  });

  if (files.indexOf(filePath) === -1) {
    files.push(filePath);
  }

  return files;
}

module.exports = function (path, opts) {
  var traced = [];

  glob(path).forEach(function (file) {
    traceRecursive(file, opts).forEach(function (dependency) {
      traced.push(dependency);
    });
  });

  return traced;
};
