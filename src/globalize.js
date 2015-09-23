var crypto = require('crypto');
var esprima = require('esprima');
var estraverse = require('estraverse');
var path = require('path');
var through = require('through2');

var prefix = '__';
var regexUseStrict = /\n\s*['"]use strict['"];?/g;

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

function defineReplacementWrapper(generatedModuleName) {
  return function defineReplacement(name, deps, func) {
    var root = (typeof window === 'undefined' ? global : window);
    var defineGlobal = root.define;
    var rval;
    var type;

    func = [func, deps, name].filter(function (cur) {
      return typeof cur === 'function';
    })[0];
    deps = [deps, name, []].filter(Array.isArray)[0];
    rval = func.apply(null, deps.map(function (value) {
      return defineDependencies[value];
    }));
    type = typeof rval;

    // Support existing AMD libs.
    if (typeof defineGlobal === 'function') {
      // Almond always expects a name so resolve one (#29).
      defineGlobal(typeof name === 'string' ? name : generatedModuleName, deps, func);
    }

    // Some processors like Babel don't check to make sure that the module value
    // is not a primitive before calling Object.defineProperty() on it. We ensure
    // it is an instance so that it can.
    if (type === 'string') {
      rval = String(rval);
    } else if (type === 'number') {
      rval = Number(rval);
    } else if (type === 'boolean') {
      rval = Boolean(rval);
    }

    // Reset the exports to the defined module. This is how we convert AMD to
    // CommonJS and ensures both can either co-exist, or be used separately. We
    // only set it if it is not defined because there is no object representation
    // of undefined, thus calling Object.defineProperty() on it would fail.
    if (rval !== undefined) {
      exports = module.exports = rval;
    }
  };
}

function hasDefineCall (data) {
  var hasDefine = false;
  estraverse.traverse(esprima.parse(data), {
    enter: function (node) {
      if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'define') {
        hasDefine = true;
        this.break();
      }
    }
  });
  return hasDefine;
}

module.exports = function () {
  return through.obj(function (vinyl, enc, callback) {
    var shims = [];
    var data = vinyl.contents.toString();
    var isAmd = hasDefineCall(data);
    var generatedModuleName = generateModuleName(vinyl.path);

    // Strict mode can cause problems with dependencies that you don't have
    // control over. Assume the worst.
    data = data.replace(regexUseStrict, '');

    // Replace all requires with references to dependency globals.
    vinyl.imports.forEach(function (imp) {
      var replaceWith = '// import: ' + makePathRelative(imp.path);

      if (path.extname(imp.path) === '.js') {
        replaceWith = generateModuleName(imp.path);
      }

      data = data.replace('require("' + imp.value + '")', replaceWith);
      data = data.replace('require(\'' + imp.value + '\')', replaceWith);
    });

    // We assume CommonJS because that's what we're using to convert it.
    shims.push('var module = {\n' + indent('exports: {}') + '\n};');
    shims.push('var exports = module.exports;');

    // We only need to generate the AMD -> CommonJS shim if it's used.
    if (isAmd) {
      shims.push('var defineDependencies = ' + defineDependencies(vinyl.imports) + ';');
      shims.push('var define = ' + defineReplacementWrapper + '("' + generatedModuleName + '");');
      shims.push('define.amd = true;');
    }

    // Add in shim vars and add some spacing so it's more readable.
    data = shims.join('\n') + '\n\n' + data;

    // We assume this was set.
    data = data + '\n\nreturn module.exports;';

    // Readability.
    data = indent(data);

    // Calling in the context of "this" ensures that if a module is using it as
    // the global scope that it is what they expect it to be.
    data = '(function () {\n' + data + '\n}).call(this);';

    // Assigns the module to a global variable.
    data = generatedModuleName + ' = ' + data;

    // Ensure it's applied to a global object.
    data = '(typeof window === \'undefined\' ? global : window).' + data;

    // Comment will show relative path to the module file.
    data = '// ' + makePathRelative(vinyl.path) + '\n' + data;

    // Reset the vinyl contents.
    vinyl.contents = new Buffer(data);

    this.push(vinyl);
    return callback();
  });
};
