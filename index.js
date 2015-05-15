var gutil = require('gulp-util'), // for gulp plugin error
    through = require('through2'), // stream library
    symbol = require('log-symbols'),
    symdiff = require('symdiff'),
    PLUGIN_NAME = 'gulp-symdiff';

// actual function that gets exported
function gulpSymdiff(opts) {
    'use strict';
    opts = opts || {};
    var templatePlugins = opts.templates || [],
        cssPlugins = opts.css || [],
        ignoreClasses = opts.ignore || [],
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

            templatePlugins
            .forEach(function (plugin) {
                Array.prototype.push.apply(templateClasses, plugin(content));
            });

            cssPlugins
            .forEach(function (plugin) {
                Array.prototype.push.apply(cssClasses, plugin(content));
            });

            self.push(file);
            done();
        });

    // we have to wait until we received all files
    // otherwise we would throw an error after the first one
    transform.on('finish', function () {
        var result = symdiff(cssClasses, templateClasses, ignoreClasses),
            error;

        if (result.css.length) {
            error = new Error('Unused CSS classes');
            error.css = result.css;
        }
        if (result.templates.length) {
            if (!error) {
                error = new Error('Undefined template classes');
            }
            error.templates = result.templates;
        }

        if (error) {
            if (error.css) {
                gutil.log.apply(gutil, [symbol.error, gutil.colors.red(error.message), error.css.join(' ')]);
            }
            if (error.templates) {
                gutil.log.apply(gutil, [symbol.error, gutil.colors.red(error.message), error.templates.join(' ')]);
            }

            this.emit('error', new gutil.PluginError(PLUGIN_NAME, error));
        }
    });

    return transform;
}

module.exports = gulpSymdiff;
