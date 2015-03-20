'use strict';

var crypto = require('crypto');
var path = require('path');

var prefix = '__';
var regexAmd = /[^a-zA-Z0-9_$]define\s*\(/;
var regexUseStrict = /\n*\s*['"]use strict['"];?\s*/gm;

function hash (str) {
  var cryp = crypto.createHash('md5');
  cryp.update(str);
  return cryp.digest('hex');
}

function generateModuleName (file) {
  return prefix + hash(file);
}

function indent (code) {
  var amount = 2;
  var lines = code.split('\n');

  lines.forEach(function (line, index) {
    lines[index] = new Array(amount + 1).join(' ') + line;
  });

  return lines.join('\n');
}

function makePathRelative (file) {
  return path.relative(process.cwd(), file);
}

function defineDependencies (imports, dependencies) {
  var code = '';
  var keyVals = imports.map(function (imp, idx) {
    return '"' + imp + '": ' + generateModuleName(dependencies[idx]);
  });

  keyVals.unshift('"exports": exports');
  keyVals.unshift('"module": module');
  code = '\n' + indent(keyVals.join(',\n')) + '\n';
  return '{' + code + '}';
}

function defineReplacement (name, deps, func) {
  var rval;
  func = [func, deps, name].filter(function (cur) { return typeof cur === 'function'; })[0];
  deps = [deps, name, []].filter(Array.isArray)[0];
  rval = func.apply(null, deps.map(function (value) {
    return defineDependencies[value];
  }));
  return rval && (exports = module.exports = rval);
}

module.exports = function () {
  return function (data, info) {
    var isAmd = data.match(regexAmd);
    var shims = [];

    // Strict mode can cause problems with dependencies that you don't have
    // control over. Assume the worst.
    data = data.replace(regexUseStrict, '');

    // Replace all requires with references to dependency globals.
    info.imports.forEach(function (imp, index) {
      data = data.replace('require("' + imp + '")', generateModuleName(info.dependencies[index]));
    });

    // We assume CommonJS because that's what we're using to convert it.
    shims.push('var module = {\n' + indent('exports: {}') + '\n};');
    shims.push('var exports = module.exports;');

    // We only need to generate the AMD -> CommonJS shim if it's used.
    if (isAmd) {
      shims.push('var defineDependencies = ' + defineDependencies(info.imports, info.dependencies) + ';');
      shims.push('var define = ' + defineReplacement + ';');
      shims.push('define.amd = true;');
    }

    // Add in shim vars and add some spacing so it's more readable.
    data = shims.join('\n') + '\n\n' + data;

    // We assume this was set.
    data = data + '\n\nreturn module.exports';

    // Readability.
    data = indent(data);

    // Calling in the context of "this" ensures that if a module is using it as
    // the global scope that it is what they expect it to be.
    data = '(function () {\n' + data + '\n}).call(this);';

    // Assigns the module to a global variable.
    data = generateModuleName(info.path) + ' = ' + data;

    // Comment will show relative path to the module file.
    data = '// ' + makePathRelative(info.path) + '\n' + data;

    return data;
  };
};
