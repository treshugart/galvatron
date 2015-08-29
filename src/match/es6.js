var detective = require('detective-es6');
var fs = require('fs');

module.exports = function (file) {
  var code = fs.readFileSync(file);
  return code ? detective(code) : [];
};
