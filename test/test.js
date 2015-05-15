var checkCSS = require('../index'),
    gutil = require('gulp-util'),
    assert = require('assert'),
    path = require('path'),
    fs = require('fs'),
    sinon = require('sinon'),

    symdiffCSS = require('symdiff-css'),
    symdiffHTML = require('symdiff-html');

function createFile(file) {
    return new gutil.File({
                base: path.join(__dirname, path.dirname(file)),
                contents: new Buffer(fs.readFileSync(file)),
                cwd: __dirname,
                path: file,
                filename: path.basename(file)
            });
}

describe('the bad CSS case', function () {

    it('should throw an error by default', function (done) {
        var dataSpy = sinon.spy(),
            css = createFile('test/bad-css/bad.css'),
            html = createFile('test/bad-css/bad.html'),
            stream = checkCSS({
                css: [symdiffCSS],
                templates: [symdiffHTML]
            });

        stream.on('data', dataSpy);
        stream.on('error', function (err) {
            // check correct class
            assert.equal(err.css.length, 1);
            assert.equal(err.css[ 0 ], 'row');

            done();
        });

        stream.write(css);
        stream.write(html);
        stream.end();
    });
});


describe('the empty case', function () {

    it('should not emit an error', function (done) {
        var errorSpy = sinon.spy(),
            emptyCSS = createFile('test/empty/empty.css'),
            emptyHTML = createFile('test/empty/empty.html'),
            stream = checkCSS({
                css: [symdiffCSS],
                templates: [symdiffHTML]
            });

        stream.on('error', errorSpy);
        stream.on('finish', function () {
            assert.equal(errorSpy.called, false);
            done();
        });

        stream.write(emptyHTML);
        stream.write(emptyCSS);
        stream.end();
    });
});

describe('the happy case', function () {

    it('should emit all files', function (done) {
        var errorSpy = sinon.spy(),
            css = createFile('test/happy/happy.css'),
            html = createFile('test/happy/happy.html'),
            stream = checkCSS({
                css: [symdiffCSS],
                templates: [symdiffHTML]
            });

        stream.on('error', errorSpy);

        var bufferedContent = [];
        stream.on('data', function (buffered) {
            bufferedContent.push(String(buffered.contents));
        });
        stream.on('finish', function () {
            // check that file is the same
            assert.equal(bufferedContent.length, 2);
            assert.equal(bufferedContent[0], String(html.contents));
            assert.equal(bufferedContent[1], String(css.contents));
            // check that no error was thrown
            assert.equal(errorSpy.called, false);

            done();
        });

        stream.write(html);
        stream.write(css);
        stream.end();
    });

    it('should ignore class patterns', function (done) {
        var errorSpy = sinon.spy(),
            dataSpy = sinon.spy(),
            pattern = /row/gi,
            css = createFile('test/bad-css/bad.css'),
            html = createFile('test/bad-css/bad.html'),
            stream = checkCSS({
                ignore: [pattern],
                css: [symdiffCSS],
                templates: [symdiffHTML]
            });

        stream.on('error', errorSpy);
        stream.on('data', dataSpy);
        stream.on('finish', function () {
            assert.equal(dataSpy.called, true);
            assert.equal(errorSpy.called, false);
            done();
        });

        stream.write(css);
        stream.write(html);
        stream.end();
    });

    it('should ignore class names', function (done) {
        var errorSpy = sinon.spy(),
            dataSpy = sinon.spy(),
            css = createFile('test/bad-css/bad.css'),
            html = createFile('test/bad-css/bad.html'),
            stream = checkCSS({
                ignore: ['row'],
                css: [symdiffCSS],
                templates: [symdiffHTML]
            });

        stream.on('error', errorSpy);
        stream.on('data', dataSpy);

        stream.on('finish', function () {
            assert.equal(dataSpy.called, true);
            assert.equal(errorSpy.called, false);
            done();
        });

        stream.write(html);
        stream.write(css);
        stream.end();
    });
});

describe('no error should be thrown', function () {
    it('without config', function (done) {
        try {
            stream = checkCSS();
            done();
        } catch (e) {}
    });

    it('with invalid CSS', function (done) {
        var dataSpy = sinon.spy(),
            errorSpy = sinon.spy(),
            invalidCSS = createFile('test/invalid/invalid.css'),
            stream = checkCSS({
                css: [symdiffCSS],
                templates: [symdiffHTML]
            });


        stream.on('data', dataSpy);
        stream.on('error', errorSpy);
        stream.on('end', function () {
            assert.equal(errorSpy.called, false);
            assert.equal(dataSpy.called, true);
            done();
        });

        stream.write(invalidCSS);
        stream.end();
    });
});

describe('the NULL case', function () {

    it('should let files through', function (done) {
        var errorSpy = sinon.spy(),
            stream = checkCSS();

        stream.on('error', errorSpy);
        stream.on('finish', function () {
            assert.equal(errorSpy.called, false);
            done();
        });
        stream.write(new gutil.File({
            path: 'null',
            contents: null
        }));

        stream.end();
    });
});

describe('the bad HTML case', function () {

    it('should throw an error', function (done) {
        var errorSpy = sinon.spy(),
            dataSpy = sinon.spy(),
            html = createFile('test/bad-html/bad.html'),
            css = createFile('test/bad-html/bad.css'),
            stream = checkCSS({
                css: [symdiffCSS],
                templates: [symdiffHTML]
            });

        stream.on('error', errorSpy);
        stream.on('data', dataSpy);
        stream.on('finish', function () {
            assert.equal(errorSpy.called, true);
            assert.equal(dataSpy.called, true);
            done();
        });

        stream.write(html);
        stream.write(css);
        stream.end();
    });
});
