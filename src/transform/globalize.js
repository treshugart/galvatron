'use strict';

var crypto = require('crypto');

function hash (str) {
  var cryp = crypto.createHash('md5');
  cryp.update(str);
  return cryp.digest('hex');
}

function generateModuleName (str) {
  return 'aui_module_' + hash(str);
}

function indent (code, amount) {
  amount = amount || 2;
  var lines = code.split('\n');

  lines.forEach(function (line, index) {
    lines[index] = new Array(amount + 1).join(' ') + line;
  });

  return lines.join('\n');
}

module.exports = function () {
  return function (data, info) {
    var windowName = 'window.' + generateModuleName(info.path);

    info.imports.forEach(function (imp, index) {
      data = data.replace('require("' + imp + '")', 'window.' + generateModuleName(info.dependencies[index]));
    });

    data = 'var module = { exports: {} };\nvar exports = module.exports;\n\n' + data;
    data = data + '\n\nreturn module.exports';
    data = indent(data);
    data = windowName + ' = (function () {\n' + data + '\n}.call(this));';

    return data;
  };
};
