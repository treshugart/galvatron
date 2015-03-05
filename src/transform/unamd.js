'use strict';

module.exports = function () {
  return function (data) {
    return data.replace(/define\(/, '(function(){})(');
  };
};
