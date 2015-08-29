var fs = require('fs');
var regexToArray = require('../util/regex-to-array');

module.exports = function (file) {
  var code = fs.readFileSync(file);
  return code ? regexToArray(/^\s*@import\s*([^'"\s]*)\s*['"]([^'"]+)['"];?/gm, code) : [];
};
