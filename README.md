# Galvatron

A library of streaming helpers for tracing, watching and transforming JavaScript files.

## Installing

```sh
npm install galvatron
```

## Including

```js
require('galvatron');
```

## Usage

Galvatron is written using a combination of Gulp and Vinyl streams. That said, you don't have to use it with Gulp. You can use it with anything that understands Streams 2 and Vinyl objects.

### Tracing Dependencies

Galvatron will take any number of source files and trace their dependencies regardless of what module format they're using. This means you can use any combination of AMD, CommonJS or ES2015 modules within your project and Galvatron will figure out the dependency tree and insert each file into the stream.

Take the following files, for example:

`src/a.js`

```js
import './b';
export default function () {};
```

`src/b.js`

```js
define(['./c'], function (c) {
  return function () {};
});
```

`src/c.js`

```js
var _ = require('lodash');
module.exports = function () {};
```

`node_modules/underscore/index.js`

```js
// Unserscore source here.
```

If you used `src/a.js` as your entry point, Galvatron would generate a dependency tree from this:

```
- src/a.js
-- src/b.js
--- src/c.js
---- node_modules/lodash/index.js
```

And insert them into the stream in the order in which they'd need to be included for concatenation:

1. `node_modules/lodash/index.js`
2. `src/c.js`
3. `src/b.js`
4. `src/a.js`

The code to do this might look something like:

```js
var galv = require('galvatron');
var gulp = require('gulp');

gulp.task('dist', function () {
  return gulp.src('src/a.js')
    .pipe(galv.trace())
    .pipe(gulp.dest('dist'));
});
```

That would trace all modules referenced by `src/a.js` regardless of module format and move them to `dist`. Elaborating on this example, say we wanted to concatenate the files together. All you'd have to do is pipe something like [gulp-concat](https://www.npmjs.com/package/gulp-concat) into the stream:

```js
var galv = require('galvatron');
var gulp = require('gulp');
var gulpConcat = require('gulp-concat');

gulp.task('dist', function () {
  return gulp.src('src/a.js')
    .pipe(galv.trace())
    .pipe(gulpConcat('all.js'))
    .pipe(gulp.dest('dist'));
});
```

Doing so would create a single `dist/all.js` with all of your dependencies in their proper order.

#### Path Resolution

Galvatron supports the standard Node path resolution semantics of `require()`:

1. [File Modules](https://nodejs.org/api/modules.html#modules_file_modules)
2. [Loading from `node_modules` Folders](https://nodejs.org/api/modules.html#modules_loading_from_node_modules_folders)
3. [Folders as Modules](https://nodejs.org/api/modules.html#modules_folders_as_modules)

However, it also applies those same semantics to `bower_components` folders and their respective `bower.json` files.

### AMD / CommonJS Shimming

In the examples above, you saw how we can move modules and concatenate them together. However, you must BYO your own shim for the module format you're using. This isn't necessary if you use the `globalize` transform. With the `globalize` transform, any module format you're using will be automatically shimmed using unique, deterministic globals.

Just pipe in `galv.globalize()`:

```js
var galv = require('galvatron');
var gulp = require('gulp');
var gulpConcat = require('gulp-concat');

gulp.task('dist', function () {
  return gulp.src('src/a.js')
    .pipe(galv.trace())
    .pipe(galv.globalize())
    .pipe(gulpConcat('all.js'))
    .pipe(gulp.dest('dist'));
});
```

The benefit of using the `globalize` transform is that your code will work anywhere, no matter what module format you use, and no matter what module format your consumers / users are using.

You can even decide that you don't want to concatenate your dependencies, or that you want to split up your batches. Since `globalize` creates deterministic global identifiers, if a module in `app.js` refers to a module in `common.js`, things will just work.

For example, if you wanted to split up your common dependencies from your app code, you could use [gulp-filter](https://www.npmjs.com/package/gulp-filter):

```js
var galv = require('galvatron');
var gulp = require('gulp');
var gulpConcat = require('gulp-concat');
var gulpFilter = require('gulp-filter');

gulp.task('dist', function () {
  var filterCommon = gulpFilter('node_modules/**', { restore: true });
  var filterApp = gulpFilter('src/**', { restore: true });
  return gulp.src('src/a.js')
    .pipe(galv.trace())
    .pipe(galv.globalize())

    // Common dependencies.
    .pipe(filterCommon)
    .pipe(gulpConcat('common.js'))
    .pipe(filterCommon.restore)

    // App code.
    .pipe(filterApp)
    .pipe(gulpConcat('app.js'))
    .pipe(filterApp.restore)

    // Write.
    .pipe(gulp.dest('dist'));
});
```

That would:

1. Trace.
2. Globalize all files.
3. Concatenate all depenencies in `node_modules` to `dist/common.js`.
4. Concatenate all dependencies in `src` to `dist/app.js`.

It would be up to whomever is consuming these batched files to load `dist/common.js` before `dist/app.js`, though.

### ES6 / ES2015 Support

Galvatron knows how to trace ES2015 files, but the Globalizer won't transform them for you. That's because there's more to it than just modules. In order to transpile ES2015 all you have to do is insert your transpiler of choice. For example, Babel:

```js
var galv = require('galvatron');
var gulp = require('gulp');
var gulpBabel = require('gulp-babel');
var gulpConcat = require('gulp-concat');

gulp.task('dist', function () {
  return gulp.src('src/index.js')
    .pipe(galv.trace())
    .pipe(gulpBabel())
    .pipe(galv.globalize())
    .pipe(gulpConcat('index.js'))
    .pipe(gulp.dest('dist'));
});
```

That would:

1. Trace `src/index.js`.
2. Transpile from ES6 to ES5.
3. Globalize.
4. Concatenate to `dist/index.js`.

### Importing Less / CSS in your JS Files

You can also import Less files from within JavaScript files and Galvatron's tracer will insert the files you import into the stream. It will not, however, trace the Less files' `@import` declarations because Less transpilers will do this for you.

You can use `gulp-filter` to insert this into the same stream as your JavaScript files:

```js
var galv = require('galvatron');
var gulp = require('gulp');
var gulpBabel = require('gulp-babel');
var gulpConcat = require('gulp-concat');
var gulpFilter = require('gulp-filter');
var gulpLess = require('gulp-less');

gulp.task('dist', function () {
  var filterLess = gulpFilter('{**/*,*}.less', { restore: true });
  var filterJs = gulpFilter('{**/*,*}.js', { restore: true });
  return gulp.src('src/index.js')
    .pipe(galv.trace())

    // JS.
    .pipe(filterJs)
    .pipe(gulpBabel())
    .pipe(galv.globalize())
    .pipe(gulpConcat('index.js'))
    .pipe(filterJs.restore)

    // Less.
    .pipe(filterLess)
    .pipe(gulpLess())
    .pipe(gulpConcat('index.css'))
    .pipe(filterLess.restore)

    // Write.
    .pipe(gulp.dest('dist'));
});
```

That would:

1. Trace.
2. Transpile, globalize and concat JS to `dist/index.js`.
3. Transpile and concat Less to `dist/index.css`.

### Watching

There is also `watch` helper that is just syntactic sugar around `gulp.watch()`.

```js
var galv = require('galvatron');
var gulp = require('gulp');
var gulpBabel = require('gulp-babel');
var gulpConcat = require('gulp-concat');
var gulpFilter = require('gulp-filter');
var gulpLess = require('gulp-less');

gulp.task('dist', function () {
  var filterLess = gulpFilter('src/{**/*,*}.less', { restore: true });
  var filterJs = gulpFilter('src/{**/*,*}.js', { restore: true });
  return gulp.src('src/index.js')
    .pipe(galv.trace())

    // JS.
    .pipe(filterJs)
    .pipe(gulpBabel())
    .pipe(galv.globalize())
    .pipe(gulpConcat('index.js'))
    .pipe(filterJs.restore)

    // Less.
    .pipe(filterLess)
    .pipe(gulpLess())
    .pipe(gulpConcat('index.css'))
    .pipe(filterLess.restore)

    // Write.
    .pipe(gulp.dest('dist'));
});

gulp.task('dist-watch', function () {
  galv.watch('src/**', ['dist']);
});
```

Galvatron's watcher does several things for you:

1. Ensures the task is run immediately.
2. Watches files matching your pattern.
3. Clears the cache for the files that have changed.
4. Re-runs the task when any of the files change.

### Caching

Sometimes a build can take awhile. If you were watching the build in dev mode and you had to wait for a long running build to complete before you could test or view your changes, that would suck.

One of the things that `watch()` does is automatically clear any cache that may have been added for a particular file. This is so that you can cache the output of a plugin. For example, if we were watching that `dist` task with the `dist-watch` task and found that things were taking too long, all you'd have to do is cache the parts taking awhile.

```js
var galv = require('galvatron');
var gulp = require('gulp');
var gulpBabel = require('gulp-babel');
var gulpConcat = require('gulp-concat');
var gulpFilter = require('gulp-filter');
var gulpLess = require('gulp-less');

gulp.task('dist', function () {
  var filterLess = gulpFilter('src/{**/*,*}.less', { restore: true });
  var filterJs = gulpFilter('src/{**/*,*}.js', { restore: true });
  return gulp.src('src/index.js')
    .pipe(galv.trace())

    // JS.
    .pipe(filterJs)
    .pipe(galv.cache('babel', gulpBabel()))
    .pipe(galv.cache('globalize', galv.globalize()))
    .pipe(gulpConcat('index.js'))
    .pipe(filterJs.restore)

    // Less.
    .pipe(filterLess)
    .pipe(galv.cache('less', gulpLess()))
    .pipe(gulpConcat('index.css'))
    .pipe(filterLess.restore)

    // Write.
    .pipe(gulp.dest('dist'));
});

gulp.task('dist-watch', function () {
  galv.watch('src/**', ['dist']);
});
```

You can cache whatever you want, just ensure that your watch pattern is set to watch the files that you're caching.
