'use strict';

module.exports = function (code) {
  return code.replace(/(\/\*([\s\S]*?)\*\/)|(\/\/(.*)$)/gm, '');
};
