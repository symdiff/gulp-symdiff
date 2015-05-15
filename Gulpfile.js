var gulp = require('gulp'),
    watch = require('gulp-watch'),
    plumber = require('gulp-plumber'),
    gutil = require('gulp-util'),
    jscs = require('gulp-jscs'),
    argv = require('minimist')(process.argv.slice(2)),
    symdiffHTML = require('symdiff-html'),
    symdiffCSS = require('symdiff-css'),
    symdiff = require('./index');

function check() {
    return gulp
        .src('test/bad-css/*.*')
        .pipe(argv.exit ? gutil.noop() : plumber())
        .pipe(symdiff({
            css: [symdiffCSS],
            templates: [symdiffHTML]
        }))
        .pipe(argv.exit ? gutil.noop() : plumber.stop());
}

gulp.task('check', check);

gulp.task('watch', function () {
    return watch({glob: 'test/bad-css/*.*'}, check);
});

gulp.task('jscs', function () {
    var jscsConfig = {
        configPath: './.jscsrc',
        fix: true
    };

    gulp
        .src('test/*.js')
        .pipe(jscs(jscsConfig))
        .pipe(gulp.dest('test'));

    return gulp
            .src('./*.js')
            .pipe(jscs(jscsConfig))
            .pipe(gulp.dest('.'));
});

gulp.task('default', ['jscs']);