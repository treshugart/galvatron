'use strict';

var babel = require('babel');
var crypto = require('crypto');
var EventEmitter = require('events').EventEmitter;
var extend = require('extend');
var glob = require('glob');
var fs = require('fs');
var mapStream = require('map-stream');
var path = require('path');
var util = require('util');
var vinylTransform = require('vinyl-transform');

var fileCache = {};

function resolveModule (mod) {
    var modFile = mod + '.js';
    var foundFile;
    var dirs = __dirname.split(path.sep);
    var lookups = {
        'bower_components': 'bower.json',
        'node_modules': 'package.json'
    };

    check:
    for (var a = 0; a < dirs.length; a++) {
        for (var b in lookups) {
            if (lookups.hasOwnProperty(b)) {
                var checkDir = path.join(__dirname, new Array(a).join('../'), b, mod);
                var packageFile = path.join(checkDir, lookups[b]);
                var found = false;
                var defaultFiles = [
                    'index.js',
                    modFile,
                    path.join('src', 'index.js'),
                    path.join('src', modFile),
                    path.join('lib', 'index.js'),
                    path.join('lib', modFile),
                    path.join('dist', 'index.js'),
                    path.join('dist', modFile)
                ];

                if (fs.existsSync(packageFile)) {
                    var pkg = require(packageFile);
                    var pkgMain = path.join(checkDir, pkg.main);

                    if (pkg.main && fs.existsSync(pkgMain)) {
                        foundFile = pkgMain;
                        break check;
                    }
                }

                found = defaultFiles.some(function (file) {
                    file = path.join(checkDir, file);
                    if (fs.existsSync(file)) {
                        foundFile = file;
                        return true;
                    }
                });

                if (found) {
                    break check;
                }
            }
        }
    }

    if (!foundFile) {
        throw new Error('Could not find the module ' + mod + '.');
    }

    return foundFile;
}

function regexToArray (regex, str) {
    var match;
    var matches = [];

    while (match = regex.exec(str)) {
        matches.push(match);
    }

    return matches;
}

function basepath (file) {
    var parts = (file || '').split(path.sep);
    parts.pop();
    return parts.join(path.sep);
}

function normalizePath (file, context) {
    file = file || '';

    // If an absolute path is provided, it becomes the new context.
    if (file.indexOf(path.sep) === 0) {
        return file;
    }

    // Get the number of directories we should go up before we format the url.
    var upDirCount = (file.match(/\.\.\//g) || []).length;

    // Remove all ../
    file = file.replace(/\.\.\//g, '');

    // Remove all ./
    file = file.replace(/\.\//g, '');

    // Split the base path and remove the "updirs" from it.
    var baseParts = basepath(context).split('/');
    baseParts.splice(baseParts.length - upDirCount, upDirCount);

    var basePath = baseParts.join('/');

    if (basePath) {
        basePath += '/';
    }

    return basePath + file + '.js';
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
    return regexToArray(/require\([\'"]([^\'"]+)[\'"]\)/g, code);
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

    map: function (map, path) {
        if (typeof map === 'object') {
            for (var a in map) {
                if (map.hasOwnProperty(a)) {
                    this.resolveModuleCache[a] = map[a];
                }
            }
        } else {
            this.resolveModuleCache[map] = path;
        }

        return this;
    },

    one: function (file) {
        return this.postTransform(file, this.preTransform(file, getFile(file)));
    },

    pre: function (transformer) {
        this.preTransformers.push(this.transformer(transformer));
        return this;
    },

    preTransform: function (file, code) {
        var that = this;

        if (this.filePreTransformCache[file]) {
            return this.filePreTransformCache[file];
        }

        this.preTransformers.forEach(function (transformer) {
            code = transformer(that, file, code);
        });

        this.emit('pre-transform', file, code);
        return this.filePreTransformCache[file] = code;
    },

    post: function (transformer) {
        this.postTransformers.push(this.transformer(transformer));
        return this;
    },

    postTransform: function (file, code) {
        var that = this;

        if (this.postTransformers[file]) {
            return this.postTransformers[file];
        }

        this.postTransformers.forEach(function (transformer) {
            code = transformer(that, file, code);
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
        this.resolveModuleCache = {};
        return this;
    },

    resolve: function (file, relativeTo) {
        if (file.indexOf(path.sep) === -1) {
            return this.resolveModuleCache[file] || (this.resolveModuleCache[file] = resolveModule(file));
        }

        return normalizePath(file, relativeTo);
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

    traceable: function (file) {
        return !this.options.ignoreDupes || this.fileTraceCache.indexOf(file) === -1;
    },

    traceRecursive: function (file, files) {
        var that = this;
        var code = getFile(file);
        files = files || [];
        file = this.resolve(file);
        code = this.preTransform(file, code);

        this.emit('trace', file, code);

        getRequires(code).forEach(function (match) {
            var dependency = that.resolve(match[1], file);
            if (files.indexOf(dependency) === -1 && that.traceable(dependency)) {
                that.traceRecursive(dependency, files);
            }
        });

        if (this.traceable(file)) {
            this.fileTraceCache.push(file);
            if (files.indexOf(file) === -1) {
                files.push(file);
            }
        }

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
    babel: function (galv, file, data) {
        return babel.transform(data, {
            // We have no idea what any dependencies might be up to. This
            // ensures backward compatibility even though ES6 is strict.
            blacklist: ['useStrict'],
            modules: 'common'
        }).code;
    },

    globalize: function (galv, file, data) {
        var windowName = 'window.' + generateModuleName(file);

        getRequires(data).forEach(function (match) {
            data = data.replace(match[0], 'window.' + generateModuleName(galv.resolve(match[1], file)));
        });

        data = 'var module = { exports: {} };\nvar exports = module.exports;\n\n' + data;
        data = data + '\n\nreturn module.exports';
        data = indent(data);
        data = windowName + ' = (function () {\n' + data + '\n}.call(this));';

        return data;
    },

    unamd: function (galv, file, data) {
        return data.replace(/define\(/, '(function(){})(');
    }
};

var exp = new Galvatron();
exp.create = function (options) {
    return new Galvatron(options);
};
module.exports = exp;
