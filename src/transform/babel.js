'use strict';

var babel = require('babel');

module.exports = function (options) {
  return function (data) {
    return babel.transform(data, options).code;
  };
};
