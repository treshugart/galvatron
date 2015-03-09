'use strict';

var nodeFs = require('fs');

function File ($fs, $matcher, $transformer, file) {
  this._fs = $fs;
  this._matcher = $matcher;
  this._transformer = $transformer;
  this._file = file;
}

File.prototype = {
  get code () {
    return this._code || (this._code = nodeFs.readFileSync(this.path).toString());
  },

  get dependencies () {
    var that = this;
    return this._dependencies || (this._dependencies = this.imports.map(function (req) {
      return that._fs.resolve(req, that.path);
    }));
  },

  get imports () {
    return this._imports || (this._imports = this._matcher(this.pre));
  },

  get path () {
    return this._file;
  },

  get post () {
    return this._post || (this._post = this._transformer.transform('post', this.pre, {
      dependencies: this.dependencies,
      imports: this.imports,
      path: this.path
    }));
  },

  get pre () {
    return this._pre || (this._pre = this._transformer.transform('pre', this.code, {
      path: this.path
    }));
  },

  clean: function () {
    delete this._code;
    delete this._dependencies;
    delete this._imports;
    delete this._post;
    delete this._pre;
    return this;
  }
};

module.exports = File;
