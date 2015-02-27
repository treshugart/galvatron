'use strict';

var babel = require('babel');
var crypto = require('crypto');
var EventEmitter = require('events').EventEmitter;
var extend = require('extend');
var glob = require('glob');
var fs = require('fs');
var mapStream = require('map-stream');
var util = require('util');
var vinylTransform = require('vinyl-transform');

var fileCache = {};

function regexToArray (regex, str) {
    var match;
    var matches = [];

    while (match = regex.exec(str)) {
        matches.push(match);
    }

    return matches;
}

function basepath (path) {
    var parts = (path || '').split('/');
    parts.pop();
    return parts.join('/');
}

function isAbsolutePath (path) {
    return path && (path[0] === '/' || path.match(/http(s)?\:\/\//));
}

function normalizePath (path, context) {
    path = path || '';

    // If an absolute path is provided, it becomes the new context.
    if (isAbsolutePath(path)) {
        return path;
    }

    // Get the number of directories we should go up before we format the url.
    var upDirCount = (path.match(/\.\.\//g) || []).length;

    // Remove all ../
    path = path.replace(/\.\.\//g, '');

    // Remove all ./
    path = path.replace(/\.\//g, '');

    // Split the base path and remove the "updirs" from it.
    var baseParts = basepath(context).split('/');
    baseParts.splice(baseParts.length - upDirCount, upDirCount);

    var basePath = baseParts.join('/');

    if (basePath) {
        basePath += '/';
    }

    return basePath + path + '.js';
}

function hash (str) {
    var cryp = crypto.createHash('md5');
    cryp.update(str);
    return cryp.digest('hex');
}

function generateModuleName (str) {
    return 'aui_module_' + hash(str);
}

function indent (code, amount) {
    amount = amount || 2;
    var lines = code.split('\n');

    lines.forEach(function (line, index) {
        lines[index] = new Array(amount + 1).join(' ') + line;
    });

    return lines.join('\n');
}

function eachFileInPaths (paths, fn) {
    if (typeof paths === 'string') {
        paths = [paths];
    }

    paths.forEach(function (path) {
        glob.sync(path).forEach(fn);
    });
}

function getFile (file) {
    return fileCache[file] || fs.readFileSync(file);
}

function getRequires (code) {
    return regexToArray(/require\([\'"](\.[^\'"]+)[\'"]\)/g, code);
}

function Galvatron (opts) {
    opts = opts || {};
    opts = {
        ignoreDupes: opts.ignoreDupes || true,
        joiner: '\n\n'
    };

    EventEmitter.call(this);
    this.options = opts;
    this.reset();
}

util.inherits(Galvatron, EventEmitter);
extend(Galvatron.prototype, {
    all: function (path) {
        var code = [];
        var that = this;

        this.trace(path).forEach(function (file) {
            code.push(that.postTransform(file, that.filePreTransformCache[file]));
        });

        return code.join(this.options.joiner);
    },

    one: function (file) {
        return this.postTransform(file, this.preTransform(file, getFile(file)));
    },

    pre: function (transformer) {
        this.preTransformers.push(this.transformer(transformer));
        return this;
    },

    preTransform: function (file, code) {
        if (this.filePreTransformCache[file]) {
            return this.filePreTransformCache[file];
        }

        this.preTransformers.forEach(function (transformer) {
            code = transformer(file, code);
        });

        this.emit('pre-transform', file, code);
        return this.filePreTransformCache[file] = code;
    },

    post: function (transformer) {
        this.postTransformers.push(this.transformer(transformer));
        return this;
    },

    postTransform: function (file, code) {
        if (this.postTransformers[file]) {
            return this.postTransformers[file];
        }

        this.postTransformers.forEach(function (transformer) {
            code = transformer(file, code);
        });

        this.emit('post-transform', file, code);
        return this.filePostTransformCache[file] = code;
    },

    reset: function () {
        this.emit('reset');
        this.filePreTransformCache = {};
        this.filePostTransformCache = {};
        this.fileTraceCache = [];
        this.preTransformers = [];
        this.postTransformers = [];
        return this;
    },

    stream: function () {
        var that = this;
        return vinylTransform(function (file) {
            return mapStream(function (data, next) {
                return next(null, that.all(file));
            });
        });
    },

    trace: function (paths) {
        var that = this;
        var traced = [];

        eachFileInPaths(paths, function (file) {
            that.traceRecursive(file).forEach(function (dep) {
                traced.push(dep);
            });
        });

        return traced;
    },

    traceRecursive: function (file, files) {
        var that = this;
        var code = getFile(file);
        files = files || [];

        code = this.preTransform(file, code);
        this.emit('trace', file, code);
        getRequires(code).forEach(function (match) {
            var dependency = normalizePath(match[1], file);

            if (files.indexOf(dependency) === -1 && (!that.options.ignoreDupes || that.fileTraceCache.indexOf(dependency) === -1)) {
                that.traceRecursive(dependency, files);
                files.push(dependency);
                that.fileTraceCache.push(dependency);
            }
        });

        return files;
    },

    transformer: function (transformer) {
        if (typeof transformer === 'string') {
            transformer = this.constructor.transform[transformer];
        }

        if (typeof transformer !== 'function') {
            throw new Error('Transformer must be a function.');
        }

        return transformer;
    }
});

Galvatron.transform = {
    babel: function (file, data) {
        return babel.transform(data, {
            // We have no idea what any dependencies might be up to. This
            // ensures backward compatibility even though ES6 is strict.
            blacklist: ['useStrict'],
            modules: 'common'
        }).code;
    },

    globalize: function (file, data) {
        var windowName = 'window.' + generateModuleName(file);

        getRequires(data).forEach(function (match) {
            data = data.replace(match[0], 'window.' + generateModuleName(normalizePath(match[1], file)));
        });

        data = 'var module = { exports: {} };\nvar exports = module.exports;\n\n' + data;
        data = data + '\n\nreturn module.exports';
        data = indent(data);
        data = windowName + ' = (function () {\n' + data + '\n}.call(this));';

        return data;
    },

    unamd: function (file, data) {
        return data.replace(/define\(/, '(function(){})(');
    }
};

var exp = new Galvatron();
exp.create = function (options) {
    return new Galvatron(options);
};
module.exports = exp;
