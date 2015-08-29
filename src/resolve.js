var path = require('path');
var fs = require('fs');

function findMap (file, map) {
  map = map || [];

  if (!map.length) {
    return file;
  }

  if (map[file]) {
    // return early for an exact match
    return path.resolve(map[file]);
  }

  for (var alias in map) {
    if (map.hasOwnProperty(alias)) {
      if (file.indexOf(alias) === 0) {
        // The file path begins with the alias, exchange that for the expanded
        // path.
        return path.resolve(file.replace(alias, map[alias]));
      }
    }
  }

  return file;
}

// Resolves a module file based on the following semantics an in order:
// - If a relative path is given:
//   - ./path/to/module-name/index.js
//   - ./path/to/module-name.js
// - If only a module name is given:
//   - [module-folder]/[module-name]/[module-file].json "main"
//   - [module-folder]/[module-name]/index.js
// - If a module name and path is given:
//   - [module-folder]/[module-name]/path/index.js
//   - [module-folder]/[module-name]/path.js
function findModule (file, relativeTo, lookups) {
  if (path.isAbsolute(file)) {
    return;
  }

  lookups = lookups || {
    bower_components: 'bower.json',
    node_modules: 'package.json'
  };

  if (file[0] === '.') {
    var fileIndex = findRelative(path.join(file, 'index.js'), relativeTo);
    if (fs.existsSync(fileIndex)) {
      return fileIndex;
    }

    var fileExact = file = findRelative(file + '.js', relativeTo);
    if (fs.existsSync(fileExact)) {
      return fileExact;
    }
  }

  var currentDir = relativeTo ? path.dirname(relativeTo) : process.cwd();
  var dirs = currentDir.split(path.sep);
  var isModuleNameOnly = file.indexOf(path.sep) === -1;

  for (var a = 0; a < dirs.length; a++) {
    for (var lookupPath in lookups) {
      var lookupBase = path.join(currentDir, new Array(a).join('../'));
      var lookupFile = path.join(lookupBase, lookupPath, file, lookups[lookupPath]);
      var lookupModule = path.join(lookupBase, lookupPath, file + '.js');
      var lookupModuleIndex = path.join(lookupBase, lookupPath, file, 'index.js');

      if (isModuleNameOnly && fs.existsSync(lookupFile)) {
        var json = require(lookupFile);
        if (json.main) {
          var withoutJs = findRelative(json.main, lookupFile);
          var withJs = findRelative(json.main + '.js', lookupFile);
          if (fs.existsSync(withoutJs)) {
            return withoutJs;
          }
          if (fs.existsSync(withJs)) {
            return withJs;
          }
        }
      }

      if (fs.existsSync(lookupModuleIndex)) {
        return lookupModuleIndex;
      }

      if (fs.existsSync(lookupModule)) {
        return lookupModule;
      }
    }
  }
}

function findRelative (file, relativeTo) {
  return relativeTo ? path.resolve(path.dirname(relativeTo), file) : path.resolve(file);
}

module.exports = function (file, opts) {
  opts = opts || {};
  file = findMap(file, opts.map);

  if (path.isAbsolute(file)) {
    return file;
  }

  return findModule(file, opts.relativeTo, opts.lookups) || findRelative(file, opts.relativeTo);
};
