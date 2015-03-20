'use strict';

module.exports = function ($fs, matchers) {
  matchers = matchers.map(function (matcher) {
    return matcher($fs);
  });

  return function (file, code) {
    return matchers.reduce(function (arr, matcher) {
      return arr.concat(matcher(file, code));
    }, []);
  };
};
