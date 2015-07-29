'use strict';

var crypto = require('crypto');
var esprima = require('esprima');
var estraverse = require('estraverse');
var path = require('path');
var recast = require('recast');

var prefix = '__';

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

function defineReplacement (name, deps, func) {
  var rval;
  var type;

  func = [func, deps, name].filter(function (cur) { return typeof cur === 'function'; })[0];
  deps = [deps, name, []].filter(Array.isArray)[0];
  rval = func.apply(null, deps.map(function (value) { return defineDependencies[value]; }));
  type = typeof rval;

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

module.exports = function (options) {
  options = options || {};
  return function (data, info) {
    var isAmd = hasDefineCall(data);
    var ast = recast.parse(data);
    var astBody = ast.program.body;
    var astBuilder = recast.types.builders;
    var importPaths = info.imports.map(function (imp) {
      return imp.path;
    });

    // Replace "use strict".
    recast.visit(ast, {
      visitExpressionStatement: function (path) {
        if (path.get('expression', 'value').value === 'use strict') {
          path.replace(null);
        }
        this.traverse(path);
      }
    });

    // Replace imports.
    recast.visit(ast, {
      visitCallExpression: function (path) {
        if (path.get('callee').value.name === 'require') {
          var importPath = path.get('arguments', 0).value.value;
          var importPathIndex = importPaths.indexOf(importPath);
          if (importPathIndex > -1) {
            var foundImportPath = importPaths[importPathIndex];
            var foundImportPathName = generateModuleName(foundImportPath);
            path.replace(astBuilder.identifier(foundImportPathName));
          }
        }
        this.traverse(path);
      }
    });

    // Shim CommonJS.
    var shims = [
      'var module = { exports: {} };',
      'var exports = module.exports;'
    ];

    // Shim AMD to use CommonsJS.
    if (isAmd) {
      shims.push(
        'var defineDependencies = ' + defineDependencies(info.imports) + ';',
        'var define = ' + defineReplacement + ';',
        'define.amd = true;'
      );
    }

    // Add shims.
    astBody.unshift.apply(astBody, recast.parse(shims.join('\n')).program.body);

    // Return CommonJS exports.
    astBody.push(recast.parse('\n\nreturn module.exports;').program.body);

    // Wrap in IIFE bound to global.
    var wrapper = recast.parse(
      '// ' + makePathRelative(info.path) + '\n' +
      generateModuleName(info.path) + ' = (function () {}).call(this);'
    );
    var wrapperBody = wrapper.program.body;
    var wrapperFnBody = wrapperBody[0].expression.right.callee.object.body.body;
    astBody.forEach(function (item) {
      // TODO Is there a better way to append all items no matter their type?
      if (Array.isArray(item)) {
        wrapperFnBody.push.apply(wrapperFnBody, item);
      } else {
        wrapperFnBody.push(item);
      }
    });

    // Compile.
    return recast.print(wrapper).code;
  };
};
