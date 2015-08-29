var detective = require('detective-amd');

module.exports = function (vinyl) {
  var code = vinyl.contents.toString();
  return code ? detective(code).filter(function (imp) {
    return ['exports', 'module', 'require'].indexOf(imp) === -1;
  }) : [];
};
