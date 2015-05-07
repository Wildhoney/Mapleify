(function main() {

    var gulp       = require('gulp'),
        jshint     = require('gulp-jshint'),
        binaryFile = './bin/mapleify.js';

    gulp.task('lint', function() {

        return gulp.src(binaryFile)
            .pipe(jshint())
            .pipe(jshint.reporter('default', {
                verbose: true
            }));

    });

    gulp.task('test', ['lint']);
    gulp.task('default', ['test']);

})();