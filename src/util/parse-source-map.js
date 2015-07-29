'use strict';

var recast = require('recast');
var sourceMapToken = '# sourceMappingURL=data:application/json;base64,';

module.exports = function parseSourceMap (ast) {
  var map;

  recast.visit(ast, {
    visitComment: function (path) {
      var value = path.value.value;
      if (value.indexOf(sourceMapToken) === 0) {
        map = value.split(sourceMapToken)[1];
        path.replace();
      }
      this.traverse(path);
    }
  });

  return map;
};
