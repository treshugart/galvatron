var detective = require('detective-amd');
var fs = require('fs');

module.exports = function (file) {
  var code = fs.readFileSync(file);
  return code ? detective(code).filter(function (imp) {
    return ['exports', 'module', 'require'].indexOf(imp) === -1;
  }) : [];
};
