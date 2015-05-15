# gulp-symdiff

[![Build Status](http://img.shields.io/travis/symdiff/gulp-symdiff.svg)](https://travis-ci.org/symdiff/gulp-symdiff) [![Coverage Status](https://coveralls.io/repos/symdiff/gulp-symdiff/badge.svg?branch=master)](https://coveralls.io/r/symdiff/gulp-symdiff?branch=master)

![gulp-symdiff](gulp-symdiff.png)

## Usage

~~~
var symdiff = require('gulp-symdiff'),
    html = require('symdiff-html'),
    css = require('symdiff-css');

gulp
    .src(['src/*.css', 'src/*.html'])  // ALL the files
    .pipe(symdiff({
        templates: [html],  // list all templates plugins
        css: [css]          // list all css plugins
    })
    .on('error', function() {
        process.exit(1);    // break the build
    }));
~~~

## License

Apache 2
