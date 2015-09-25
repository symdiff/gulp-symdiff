var gutil = require('gulp-util'), // for gulp plugin error
    through = require('through2'), // stream library
    symbol = require('log-symbols'),
    _ = require('lodash'),
    symdiff = require('symdiff'),
    PLUGIN_NAME = 'gulp-symdiff';

function dedup(t, idx, arr) {
    return arr.lastIndexOf(t) === idx;
}

function flatten(prev, cur) {
    Array.prototype.push.apply(prev, cur);
    return prev;
}

// actual function that gets exported
function gulpSymdiff(opts) {
    'use strict';
    opts = opts || {};
    var templatePlugins = opts.templates || [],
        cssPlugins = opts.css || [],
        ignoreClasses = opts.ignore || [],
        classesPerFile = {},
        warningsPerFile = {},
        templateClasses = [],
        cssClasses = [],

        transform = through.obj(function (file, enc, done) {
            var self = this,
                content = String(file.contents);

            if (file.isNull()) {
                self.push(file);
                return done();
            }

            if (file.isStream()) {
                return done(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
            }


            var filePath = String(file.path),
                tpl = templatePlugins
                        .map(function (plugin) {
                            return plugin(content);
                        }),
                css = cssPlugins
                        .map(function (plugin) {
                            return plugin(content);
                        }),
            
            // collect warnings
                tplWarnings = tpl
                                .map(function (classes) {
                                    return classes._warnings || [];
                                })
                                .reduce(flatten, []),
                cssWarnings = css
                                .map(function (classes) {
                                    return classes._warnings || [];
                                })
                                .reduce(flatten, []);
            warningsPerFile[filePath] = tplWarnings.concat(cssWarnings);

            // class handling
            tpl = tpl
                    .reduce(flatten, [])
                    .filter(dedup);
            css = css
                    .reduce(flatten, [])
                    .filter(dedup);

            classesPerFile[filePath] = tpl.concat(css);

            Array.prototype.push.apply(templateClasses, tpl);
            Array.prototype.push.apply(cssClasses, css);

            self.push(file);
            done();
        });

    // we have to wait until we received all files
    // otherwise we would throw an error after the first one
    transform.on('finish', function () {
        var diff = symdiff(cssClasses, templateClasses, ignoreClasses),
            joinedDiff = diff.css.concat(diff.templates),
            outputLines = [];

        Object
        .keys(warningsPerFile)
        .forEach(function (file) {
            warningsPerFile[file]
            .forEach(function (warning) {
                outputLines.push([
                    symbol.warning,
                    gutil.colors.yellow(file),
                    gutil.colors.yellow(warning)
                ]);
            });
        });

        Object
        .keys(classesPerFile)
        .forEach(function (file) {
            var classes = classesPerFile[file],
                intersect = _.intersection(classes, joinedDiff);

            if (intersect.length) {
                outputLines.push([
                    symbol.error,
                    gutil.colors.red(file),
                    'contains unused classes:',
                    gutil.colors.blue(intersect.join(', '))
                ]);
            }
        });

        // custom event for testing
        this.emit('__OUTPUT_LINES__', outputLines);

        outputLines.forEach(function (line) {
            gutil.log.apply(gutil, line);
        });

        if (joinedDiff.length) {
            var error = new gutil.PluginError(PLUGIN_NAME, new Error('Unused classes found.'));
            error.classes = joinedDiff;
            this.emit('error', error);
        }
    });

    return transform;
}

module.exports = gulpSymdiff;
