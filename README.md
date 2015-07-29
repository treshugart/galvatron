# Galvatron

Library for tracing, transforming and bundling any type of source file and its dependencies. It currently has built-in support for:

1. ES6
2. AMD
3. CommonJS
4. Less (experimental)

## Installing

```sh
npm install galvatron
```

## Including

```js
require('galvatron');
```

## Usage

The most common usage for Galvatron is to take a single file and transform it into a concatenated JavaScript file that includes the content of that file and all of its dependencies.

```js
var fs = require('fs');
var galvatron = require('galvatron');

fs.writeFile('dist/index.js', galvatron.bundle('src/index.js').compile());
```

### Multiple File Transformation

If you want to take multiple files and transform them into a single file you can do that too. It will still trace each file's dependencies in the proper order and will additionally make sure that none are duplicated. Both a path, glob pattern or an array of a mixture of either are supported.

```js
var compiled = galvatron.bundle([
  'bower_components/jquery/jquery.js',
  'src/*.js'
]).compile();
```

### Dependency Resolution

Dependency resolution follows the same rules as Node's `require()`. However, it not only applies them to `node_modules` folders but also to `bower_components` folders. This means you can do things like:

```js
// Will look in bower_components and node_modules *.json files for a "main"
// entry or "jquery/index.js".
import $ from 'jquery';

// Will look in bower_components and node_modules for "jquery/src/jquery.js".
import $ from 'jquery/src/jquery';

// Will look for "./bower_components/jquery/src/jquery.js".
import $ from './bower_components/jquery/src/jquery';

// Will look for "./node_modules/jquery/src/jquery.js".
import $ from './node_modules/jquery/src/jquery';
```

The same semantics are applied to any path you give to Galvatron. For example, you can add things to your bundle based on their module name:

```js
var underscoreAndDepenendies = galvatron.bundle('underscore').compile();
```

### Transforms

Galvatron has a notion of both `pre` and `post` transforms. The `pre` transforms happen prior to tracing dependencies. This means that if you need to transform your code prior to tracing it for its dependencies, then you can do so. The `post` transforms happen after tracing and are intended to transform your source before it is concatenated.

There are two built-in transformers:

1. `babel`
2. `globalize`

Built-in transformers can be specified by their name:

```js
galvatron.transform.post('babel', options);
```

Or be used directly:

```js
var babel = require('galvatron/transform/babel');
galvatron.transform.post(babel(options));
```

#### Babel

The `babel` transformer will transpile your code from ES6 to ES5 using [Babel](https://babeljs.io/). Simply tell Galvatron to use it:

```js
galvatron.tranform.post('babel');
```

#### Globalize

The `globalize` transform transforms your code from CommonJS into browser globals that won't conflict with any other globals. If they do, then you should probably reassess how you name your global variables. They're *hardly* global.

The great part about this is that there's no need for a shim, so code bloat is kept to a minimum. Since there's no shim, you'll never have any module loader conflicts and globals will work even if you've split up your concatenated source into separate files and they reference each other's dependencies.

This is especially useful when you're writing an open source library and you've got zero control over what your consumer is including with your library or framework. If you use Browserify you have to be careful because their shim will use whatever `require` is on the page if it's there before the shim. This means that it could potentially break the world. The solution according to an [open issue](https://github.com/substack/node-browserify/issues/790) is to change the AMD code. This doesn't help if you don't have control over other code on the page.

#### Custom Transformers

You can also write custom transformers. A transformer is simply a function that takes two arguments.

```js
galvatron.transformer.pre(function (code, data) {
  return doSomeTransformationsTo(code);
});
```

The `code` argument is a string representing the current form of the code. It may have been altered by a previous transformer, or if this is the first transformation step, it may be the exact contents of the file.

The `data` argument is an object containing information about the file. Depending on the type of transformer, this will contain different information.

As a `pre` transformer:

- `path` The file path.

As a `post` transformer:

- `path` The file path.
- `imports` An array of objects containing the full `path` to, and exact `value` of, the import.

### Streams

Streams are super useful if you want to integrate your build into a stream system such as Gulp.

```js
var bundle = galvatron.bundle('src/*.js');
gulp.src(bundle.files)
  .pipe(bundle.stream())
  .pipe(gulp.dest('dist'));
```

The `stream()` method returns a `vinyl` stream created by `vinylTransform`, so it can be used anywhere a `vinyl` stream can be used, not just with Gulp.

You can create watch streams, too:

```js
var bundle = galvatron.bundle('src/*.js');
gulp.src(bundle.files)
  .pipe(bundle.watch())
  .pipe(bundle.stream())
  .pipe(gulp.dest('dist'));
```

And if you want to conditionally watch for changes, you can use the `watchIf(condition)` method instead of just `watch()` which may seem like a small amount of syntactic sugar, but it can really clean up your logic:

```js

var bundle = galvatron.bundle('src/*.js');
var shouldWatchForChanges = true;
gulp.src(bundle.files)
  .pipe(bundle.watchIf(shouldWatchForChanges))
  .pipe(bundle.stream())
  .pipe(gulp.dest('dist'));
```
