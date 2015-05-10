(function main() {

    var gulp       = require('gulp'),
        jshint     = require('gulp-jshint'),
        mocha      = require('gulp-mocha'),
        binaryFile = './bin/mapleify.js';

    gulp.task('lint', function() {

        return gulp.src(binaryFile, { read: false })
            .pipe(jshint())
            .pipe(jshint.reporter('default', {
                verbose: true
            }));

    });

    gulp.task('mocha', function () {

        return gulp.src('tests/spec.js', { read: false })
            .pipe(mocha({ reporter: 'list' }));

    });

    gulp.task('test', ['lint', 'mocha']);
    gulp.task('default', ['test']);

})();