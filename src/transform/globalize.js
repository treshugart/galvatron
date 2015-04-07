'use strict';

var crypto = require('crypto');
var fs = require('fs');
var path = require('path');

var prefix = '__';
var regexSourcemap = /\n*\s*\/\/.?\s*sourceMappingURL=(.*)/m;
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

function relative (file) {
  return path.relative(process.cwd(), file);
}

<<<<<<< Updated upstream
=======
function defineDependencies (imports) {
  var code = '';
  var keyVals = imports.map(function (imp) {
    return '"' + imp.value + '": ' + generateModuleName(imp.path);
  });

  keyVals.unshift('"exports": exports');
  keyVals.unshift('"module": module');
  code = '\n' + indent(keyVals.join(',\n')) + '\n';
  return '{' + code + '}';
}

function defineReplacement (name, deps, func) {
  var rval;
  var type;

  func = [func, deps, name].filter(function (cur) { return typeof cur === 'function'; })[0];
  deps = [deps, name, []].filter(Array.isArray)[0];

  var allDependenciesDefined = deps.every(function (dep) {
    return defineDependencies.hasOwnProperty(dep);
  });

  var hasExternalDependency = !allDependenciesDefined;
  if (hasExternalDependency) {
    originalDefine.apply(this, arguments);
    return;
  }

  rval = func.apply(null, deps.map(function (value) { return defineDependencies[value]; }));
  type = typeof rval;

  // Some processors like Babel don't check to make sure that the module value
  // is not a primitive before calling Object.defineProperty() on it. We ensure
  // it is an instance so that it can.
  if (type === 'string') {
    rval = new String(rval);
  } else if (type === 'number') {
    rval = new Number(rval);
  } else if (type === 'boolean') {
    rval = new Boolean(rval);
  }

  // Reset the exports to the defined module. This is how we convert AMD to
  // CommonJS and ensures both can either co-exist, or be used separately. We
  // only set it if it is not defined because there is no object representation
  // of undefined, thus calling Object.defineProperty() on it would fail.
  if (rval !== undefined) {
    exports = module.exports = rval;
  }
}

>>>>>>> Stashed changes
module.exports = function () {
  return function (data, info) {
    var sourcemap = data.match(regexSourcemap);
    sourcemap = sourcemap && sourcemap[1];

<<<<<<< Updated upstream
    if (sourcemap) {
      data = data.replace(regexSourcemap, '');
=======
    // We assume CommonJS because that's what we're using to convert it.
    shims.push('var module = {\n' + indent('exports: {}') + '\n};');
    shims.push('var exports = module.exports;');

    // We only need to generate the AMD -> CommonJS shim if it's used.
    if (isAmd) {
      shims.push('var originalDefine = window.define;');
      shims.push('var defineDependencies = ' + defineDependencies(info.imports) + ';');
      shims.push('var define = ' + defineReplacement + ';');
      shims.push('define.amd = true;');
>>>>>>> Stashed changes
    }

    info.imports.forEach(function (imp, index) {
      data = data.replace('require("' + imp + '")', generateModuleName(info.dependencies[index]));
    });

    data = data.replace(regexUseStrict, '');
    data = 'var module = { exports: {} };\nvar exports = module.exports;\n\n' + data;
    data = data + '\n\nreturn module.exports';
    data = indent(data);
    data = '(function () {\n' + data + '\n}).call(this);';
    data = generateModuleName(info.path) + ' = ' + data;
    data = '// ' + relative(info.path) + '\n' + data;

    return data;
  };
};
