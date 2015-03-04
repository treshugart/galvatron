'use strict';

module.exports = function (galv, file, data) {
  return data.replace(/define\(/, '(function(){})(');
};
