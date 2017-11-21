'use strict';

const gulp = require('gulp');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const sharp = require('sharp');

const sourceFiles = {
	contentScript: 'src/js/contentscript.js',
	mainScript: 'src/js/script.js',
	icon: 'src/icons/signTextLSF.svg',
	simpleIcon: 'src/icons/signTextLSF-simple.svg'
};

const destinationDirs = {
	js: 'extension/dist/js/',
	icons: 'extension/dist/icons/'
};

const iconSizes = [16, 40, 48, 64, 128];

gulp.task('browser-polyfill' , function() {
	return gulp
		// Source file
		.src('node_modules/webextension-polyfill/dist/browser-polyfill.js')
		// Output directory
		.pipe(gulp.dest(destinationDirs.js));
});

gulp.task('contentscript' , function() {
	return gulp
		// Source file
		.src(sourceFiles.contentScript)
		// Output directory
		.pipe(gulp.dest(destinationDirs.js));
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
		.pipe(gulp.dest(destinationDirs.js));
});

gulp.task('icons' , function() {
	iconSizes.forEach(function(size) {
		size = parseInt(size);
		var source = size < 32 ? sourceFiles.simpleIcon : sourceFiles.icon;
		console.log('Generating icon ' + size + 'x' + size);
		
		sharp(source)
			.resize(size, size)
			.toFile(destinationDirs.icons + 'signTextLSF-' + size + '.png');
	});
});

gulp.task('build', ['browser-polyfill', 'contentscript', 'script', 'icons']);

gulp.task('watch', function() {
	gulp.watch(sourceFiles.contentScript, ['contentscript']);
	gulp.watch(sourceFiles.mainScript, ['script']);
});

gulp.task('default', ['build', 'watch']);
