var detective = require('detective-es6');

module.exports = function (vinyl) {
  var code = vinyl.contents.toString();
  return code ? detective(code) : [];
};
