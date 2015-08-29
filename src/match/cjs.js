var detective = require('detective-cjs');
var fs = require('fs');

module.exports = function (file) {
  var code = fs.readFileSync(file);
  return code ? detective(code) : [];
};
