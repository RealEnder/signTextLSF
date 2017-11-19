'use strict';

const gulp = require('gulp');
const browserify = require('browserify');
const source = require('vinyl-source-stream');

gulp.task('contentscript' , function() {
	// Source file
	return gulp.src('src/contentscript.js')
	// Output directory
	.pipe(gulp.dest('./extension/dist/'))
});

gulp.task('script' , function() {
	return browserify({
		// Source file
		entries: 'src/script.js',
	})
	.bundle()
	// Output filename
	.pipe(source('script.js'))
	// Output directory
	.pipe(gulp.dest('extension/dist/'))
});

gulp.task('default', ['contentscript', 'script']);