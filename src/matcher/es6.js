'use strict';

var regexToArray = require('../util/regex-to-array');

function Matcher() {}
Matcher.prototype = {
  match: function (code) {
    return regexToArray(/^\s*import[^'"]*['"]([^'"]+)['"];?/gm, code).map(function (imp) {
      return imp[1];
    });
  }
};

module.exports = Matcher;
