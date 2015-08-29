var regexToArray = require('../util/regex-to-array');

module.exports = function (vinyl) {
  var code = vinyl.contents.toString();
  return code ? regexToArray(/^\s*@import\s*([^'"\s]*)\s*['"]([^'"]+)['"];?/gm, code) : [];
};
