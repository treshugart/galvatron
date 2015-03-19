'use strict';

var nodeFs = require('fs');
var cache = {};

function File ($matcher, $transformer, file) {
  if (cache[file]) {
    return cache[file];
  }

  cache[file] = this;
  this._matcher = $matcher;
  this._transformer = $transformer;
  this._file = file;
}

File.prototype = {
  get code () {
    return this._code || (this._code = nodeFs.readFileSync(this.path).toString());
  },

  get imports () {
    return this._imports || (this._imports = this._matcher(this.path, this.pre));
  },

  get path () {
    return this._file;
  },

  get post () {
    return this._post || (this._post = this._transformer.transform('post', this.pre, {
      imports: this.imports,
      path: this.path
    }));
  },

  get pre () {
    return this._pre || (this._pre = this._transformer.transform('pre', this.code, {
      path: this.path
    }));
  },

  cached: function () {
    return cache[this.path];
  },

  expire: function () {
    delete cache[this.path];
    delete this._code;
    delete this._imports;
    delete this._post;
    delete this._pre;
    return this;
  }
};

module.exports = File;
