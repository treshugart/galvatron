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

The most basic usage would be tracing and concatenating JavaScript files:

```js
var galv = require('galvatron');
var gulp = require('gulp');
var gulpConcat = require('gulp-concat');

gulp.task('dist', function () {
  return gulp.src('src/index.js')
    .pipe(galv.trace())
    .pipe(gulpConcat('index.js'))
    .pipe(gulp.dest('dist'));
});
```

That would trace the AMD / CommonJS and ES2015 imports in `src/index.js` and concatenate them into `dist/index.js` ensuring that their dependency order is correct.

### AMD / CommonJS Shimming

In the previous example, you must BYO your own shim for whatever module format you're using. However, if you add in the `globalize` transformer, then it will automatically shim AMD or CommonJS for you.

Just pipe in `galv.globalize()` and now you don't even need to include your own shim:

```js
var galv = require('galvatron');
var gulp = require('gulp');
var gulpConcat = require('gulp-concat');

gulp.task('dist', function () {
  return gulp.src('src/index.js')
    .pipe(galv.trace())
    .pipe(galv.globalize())
    .pipe(gulpConcat('index.js'))
    .pipe(gulp.dest('dist'));
});
```

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
    .pipe(filterJs)
    .pipe(gulpBabel())
    .pipe(galv.globalize())
    .pipe(gulpConcat('index.js'))
    .pipe(filterJs.restore)
    .pipe(filterLess)
    .pipe(gulpLess())
    .pipe(gulpConcat('index.css'))
    .pipe(filterLess.restore)
    .pipe(gulp.dest('dist'));
});
```

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
  var filterLess = gulpFilter('{**/*,*}.less', { restore: true });
  var filterJs = gulpFilter('{**/*,*}.js', { restore: true });
  return gulp.src('src/index.js')
    .pipe(galv.trace())
    .pipe(filterJs)
    .pipe(gulpBabel())
    .pipe(galv.globalize())
    .pipe(gulpConcat('index.js'))
    .pipe(filterJs.restore)
    .pipe(filterLess)
    .pipe(gulpLess())
    .pipe(gulpConcat('index.css'))
    .pipe(filterLess.restore)
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

You'll notice that one of the things that the watcher does is clear a file's cache. This is so that you can cache the output of a plugin. For example, if we were watching that `dist` task with the `dist-watch` task and found that things were taking too long, all we'd have to do is cache the parts taking awhile.

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
    .pipe(filterJs)
    .pipe(galv.cache('babel', gulpBabel()))
    .pipe(galv.cache('globalize', galv.globalize()))
    .pipe(gulpConcat('index.js'))
    .pipe(filterJs.restore)
    .pipe(filterLess)
    .pipe(gulp.cache('less', gulpLess()))
    .pipe(gulpConcat('index.css'))
    .pipe(filterLess.restore)
    .pipe(gulp.dest('dist'));
});

gulp.task('dist-watch', function () {
  galv.watch('src/**', ['dist']);
});
```

You can cache whatever you want, just ensure that your watch pattern is set to watch the files that you're caching.
