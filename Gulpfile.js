'use strict';

const gulp = require('gulp');
const browserify = require('browserify');
const source = require('vinyl-source-stream');

const sourceFiles = {
	contentScript: 'src/contentscript.js',
	mainScript: 'src/script.js'
};

gulp.task('browser-polyfill' , function() {
	// Source file
	return gulp.src('node_modules/webextension-polyfill/dist/browser-polyfill.js')
	// Output directory
	.pipe(gulp.dest('extension/dist/'))
});

gulp.task('contentscript' , function() {
	// Source file
	return gulp.src(sourceFiles.contentScript)
	// Output directory
	.pipe(gulp.dest('extension/dist/'))
});

gulp.task('script' , function() {
	return browserify({
		// Source file
		entries: sourceFiles.mainScript,
	})
	.bundle()
	// Output filename
	.pipe(source('script.js'))
	// Output directory
	.pipe(gulp.dest('extension/dist/'))
});

gulp.task('build', ['browser-polyfill', 'contentscript', 'script']);

gulp.task('watch', function() {
	gulp.watch(sourceFiles.contentScript, ['contentscript']);
	gulp.watch(sourceFiles.mainScript, ['script']);
});

gulp.task('default', ['build', 'watch']);
