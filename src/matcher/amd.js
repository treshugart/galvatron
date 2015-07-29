'use strict';

var detective = require('detective-amd');

module.exports = function () {
  return function (code) {
    return detective(code).map(function (imp) {
      return {
        path: imp
      };
    });
  };
};
