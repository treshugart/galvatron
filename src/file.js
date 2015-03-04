'use strict';

var fs = require('fs');

function regexToArray (regex, str) {
  var match;
  var matches = [];

  while (match = regex.exec(str)) {
    matches.push(match);
  }

  return matches;
}

function getRequires (code) {
  return regexToArray(/require\([\'"]([^\'"]+)[\'"]\)/g, code);
}

function File (galv, file) {
  this._galv = galv;
  this._file = file;
}

File.prototype = {
  get code () {
    return this._code || (this._code = fs.readFileSync(this.path).toString());
  },

  get dependencies () {
    var that = this;
    return this._dependencies || (this._dependencies = this.requires.map(function (req) {
      return that._galv.resolve(req, that.path);
    }));
  },

  get path () {
    return this._file;
  },

  get post () {
    return this._post || (this._post = this._galv._transform('post', this.path, this.pre));
  },

  get pre () {
    return this._pre || (this._pre = this._galv._transform('pre', this.path, this.code));
  },

  get requires () {
    return this._requires || (this._requires = getRequires(this.pre).map(function (req) {
      return req[1];
    }));
  },

  clean: function () {
    delete this._code;
    delete this._dependencies;
    delete this._post;
    delete this._pre;
    delete this._requires;
    return this;
  }
};

module.exports = File;
