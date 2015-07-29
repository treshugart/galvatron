'use strict';

module.exports = function (matchers) {
  matchers = matchers.map(function (matcher) {
    return matcher();
  });

  return function () {
    var args = [].slice.call(arguments);
    var that = this;
    return matchers.reduce(function (arr, matcher) {
      return arr.concat(matcher.apply(that, args));
    }, []);
  };
};
