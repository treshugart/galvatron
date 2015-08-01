'use strict';

module.exports = function (matchers) {
  return function () {
    var args = [].slice.call(arguments);
    var that = this;
    return matchers.reduce(function (arr, matcher) {
      return arr.concat(matcher.apply(that, args));
    }, []);
  };
};
