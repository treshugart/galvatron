'use strict';

module.exports = function ($fs, matchers) {
  matchers = matchers.map(function (matcher) {
    return matcher($fs);
  });

  return function (file, code) {
    var matches = [];

    matchers.forEach(function (matcher) {
      matches = matches.concat(matcher(file, code));
    });

    return matches;
  };
};
