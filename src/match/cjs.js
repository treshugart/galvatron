var detective = require('detective-cjs');

module.exports = function (vinyl) {
  var code = vinyl.contents.toString();
  return code ? detective(code) : [];
};
