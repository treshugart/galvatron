'use strict';

var crypto = require('crypto');
var extend = require('extend');
var path = require('path');

function hash (str) {
  var cryp = crypto.createHash('md5');
  cryp.update(str);
  return cryp.digest('hex');
}

function generateModuleName (prefix, str) {
  return prefix + hash(str);
}

function indent (code, amount) {
  amount = amount || 2;
  var lines = code.split('\n');

  lines.forEach(function (line, index) {
    lines[index] = new Array(amount + 1).join(' ') + line;
  });

  return lines.join('\n');
}

function relative (file) {
  return path.relative(process.cwd(), file);
}

module.exports = function (config) {
  config = extend({
    prefix: '__module_'
  }, config);

  return function (data, info) {
    var windowName = 'window.' + generateModuleName(config.prefix, info.path);

    info.imports.forEach(function (imp, index) {
      data = data.replace('require("' + imp + '")', 'window.' + generateModuleName(config.prefix, info.dependencies[index]));
    });

    data = 'var module = { exports: {} };\nvar exports = module.exports;\n\n' + data;
    data = data + '\n\nreturn module.exports';
    data = indent(data);
    data = windowName + ' = (function () {\n' + data + '\n}.call(this));';
    data = '// ' + relative(info.path) + '\n' + data;

    return data;
  };
};
