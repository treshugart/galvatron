'use strict';

var crypto = require('crypto');
var path = require('path');
var recast = require('recast');

var astBuilder = recast.types.builders;
var prefix = '__';
var sourceMapToken = '# sourceMappingURL=data:application/json;base64,';

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

function hasDefineCall (ast) {
  var hasDefine = false;
  recast.visit(ast, {
    visitCallExpression: function (node) {
      var callee = node.value.callee;
      if (callee.type === 'Identifier' && callee.name === 'define') {
        hasDefine = true;
        return false;
      }
      this.traverse(node);
    }
  });
  return hasDefine;
}

function parseSourceMap (data) {
  var sourceMap;

  recast.visit(recast.parse(data), {
    visitComment: function (path) {
      var value = path.value.value;
      if (value.indexOf(sourceMapToken) === 0) {
        sourceMap = value.split(sourceMapToken)[1];
      }
      this.traverse(path);
    }
  });

  return sourceMap ? JSON.parse(new Buffer(sourceMap, 'base64').toString()) : '';
}

function compileSourceMap (map) {
  return sourceMapToken + new Buffer(JSON.stringify(map)).toString('base64');
}

module.exports = function (options) {
  options = options || {};
  return function (data, info) {
    var sourceMap = parseSourceMap(data);
    var ast = recast.parse(data, {
      sourceFileName: info.path,
      inputSourceMap: sourceMap
    });
    var astBody = ast.program.body;
    var importPaths = info.imports.map(function (imp) {
      return imp.path;
    });

    recast.visit(ast, {
      // Replace imports.
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
      },

      // Replace source map.
      visitComment: function (path) {
        var value = path.value.value;
        if (value.indexOf(sourceMapToken) === 0) {
          path.replace();
        }
        this.traverse(path);
      },

      // Replace "use strict".
      visitExpressionStatement: function (path) {
        if (path.get('expression', 'value').value === 'use strict') {
          path.replace();
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
    if (hasDefineCall(ast)) {
      shims.push(
        'var defineDependencies = ' + defineDependencies(info.imports) + ';',
        'var define = ' + defineReplacement + ';',
        'define.amd = true;'
      );
    }

    // Add shims.
    astBody.unshift.apply(astBody, recast.parse(shims.join('\n')).program.body);

    // Return CommonJS exports.
    astBody.push.apply(astBody, recast.parse('\n\nreturn module.exports;').program.body);

    // Generate IIFE for wrapping the compiled code.
    var wrapper = recast.parse(
      // Comment to easily see which file it is.
      '// ' + makePathRelative(info.path) + '\n' +

      // Assign to *hardly* global variable.
      generateModuleName(info.path) + ' = (function () {}).call(this);'
    );

    // Wrap the code in the IIFE.
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

    var parsed = recast.print(wrapper, {
      sourceMapName: sourceMap && info.path
    });
    var code = parsed.code;

    if (parsed.map) {
      code += '\n\n//' + compileSourceMap(parsed.map);
    }

    return code;
  };
};
