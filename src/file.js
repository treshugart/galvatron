'use strict';

var nodeFs = require('fs');
var recast = require('recast');
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
  get ast () {
    return this._ast || (this._ast = recast.parse(this.code, {
      sourceFileName: this.path
    }));
  },

  get code () {
    return this._code || (this._code = nodeFs.readFileSync(this.path).toString());
  },

  get imports () {
    return this._imports || (this._imports = this._matcher(this.code));
  },

  get path () {
    return this._file;
  },

  get transformed () {
    if (!this._transformed) {
      this._transformed = this._transformer.transform({
        ast: this.ast,
        imports: this.imports,
        map: recast.print(this.ast, { sourceMapName: this.path }),
        path: this.path
      });
    }
    return this._transformed;
  },

  expire: function () {
    delete cache[this.path];
    delete this._ast;
    delete this._code;
    delete this._imports;
    delete this._transformed;
    return this;
  }
};

module.exports = File;
