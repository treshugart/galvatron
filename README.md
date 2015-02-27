# Galvatron

Library for transforming, tracing and concatenating CommonJS files.

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

fs.writeFile('dist/*.js', galvatron.all('src/index.js'));
```

### Multiple File Transformation

If you want to take multiple files and transform them into a single file you can do that too. It will still trace each file's dependencies in the proper order and will additionally make sure that none are duplicated. As you can see, a both a path or glob pattern are supported. You can also use a string or an array to specify your files.

```js
var compiled = galvatron.all([
  'bower_components/jquery/jquery.js',
  'src/*.js'
]);
```

### Dependency Resolution

Dependencies are resolved in a couple different ways depending on the path that is given. First off, the files you specify to get traced and concatenated are resolved relative to the current working directory. Internally Galvatron will inspect the path and determine if the path is:

1. A module name.
2. An absolute path.
3. A relative path.

Module names are resolved in several different ways.

It will go up the directory tree - starting with the directory which the `require()` call originated in - and look for a `bower_components` folder and a `node_modules` folder, in that order. It first looks to see if there is a `bower.json` or a `package.json` depending on the package manager and if it contains a `main` definition, it will use that. If it doesn't find a main, it will look for an `index.js` or a file with the same name as the module but with a `js` extension in `src`, `lib` and `dist` (in that order).

### Transforms

Galvatron has a notion of both `pre` and `post` transorms. The `pre` transforms happen prior to tracing dependencies. This way, if you're writing your stuff in ES6 you can set a `pre` transformer to transpile your code from ES6 to ES5 CommonJS so that Galvatron can properly inspect your files.

`Post` transformers happen after tracing and are intended to transform your CommonJS source before it is concatenated.

There are three built-in transformers:

1. `babel`
2. `globalize`
3. `unamd`

#### Babel

The `babel` transformer will transpile your code from ES6 to ES5 using [Babel](https://babeljs.io/). Simply tell Galvatron to use it:

```js
galvatron.pre('babel');
```

#### Globalize

The `globalize` transform transforms your code from CommonJS into browser globals that won't conflict with any other globals. If they do, then you should probably reassess how you name your global variables. They're *hardly* global.

The great part about this is that there's no need for a shim, so code bloat is kept to a minimum. Since there's no shim, you'll never have any module loader conflicts and globals will work even if you've split up your concatenated source into separate files and they reference each other's dependencies.

This is especially useful when you're writing an open source library and you've got zero control over what your consumer is including with your library or framework. If you use Browserify you have to be careful because their shim will use whatever `require` is on the page if it's there before the shim. This means that it could potentially break the world. The solution according to an [open issue](https://github.com/substack/node-browserify/issues/790) is to change the AMD code. This doesn't help if you don't have control over other code on the page.

#### UnAMD

The `unamd` transform will no-op any AMD code that is traced by Galvatron. This might change in the future to only no-op anonymous modules. This is useful when you don't want to put your code through `r.js` just to make the `define` calls happy. If you're using CommonJS, you've probably got no use for them anyways.

#### Custom Transformers

You can also write custom transformers.

```js
galvatron.pre(function (galv, file, code) {
  // Do something with `file` or `code` and return the result as a string.
  //
  // `galv` is a reference to the galvatron instance just in case you don't
  // have access to it in your current scope.
});
```

That would define a `pre` transformer. To define a `post` transformer, all you've got to do is call `post`.

```js
galvatron.post(function (galv, file, code) {
  // Do something with `file` or `code` and return the result as a string.
  //
  // `galv` is a reference to the galvatron instance just in case you don't
  // have access to it in your current scope.
});
```

### Streams

Streams are super useful if you want to integrate your build into a stream system such as Gulp.

```js
gulp.src('src/*.js')
  .pipe(galvatron.stream())
  .pipe(gulp.dest('dist'));
```

The `stream()` method returns a `vinyl` stream created by `vinylTransform`, so it can be used anywhere a `vinyl` stream can be used, not just with Gulp.
