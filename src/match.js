var path = require('path');
var matchAmd = require('./match/amd');
var matchCjs = require('./match/cjs');
var matchEs6 = require('./match/es6');
var matchLess = require('./match/less');
var matchers = {
  amd: [matchAmd],
  cjs: [matchCjs],
  es6: [matchEs6],
  es2015: [matchEs6],
  less: [matchLess],
  js: [matchAmd, matchCjs, matchEs6]
};

module.exports = function (file, opts) {
  opts = opts || {};
  var ext = path.extname(file).replace('.', '');
  var use = opts.matchers || matchers[ext];

  if (use) {
    return use.reduce(function (arr, matcher) {
      return arr.concat(matcher(file));
    }, []);
  }

  return [];
};
