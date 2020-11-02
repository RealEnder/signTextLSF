'use strict';

const gulp = require('gulp');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const rename = require('gulp-rename');
const babel = require('babelify');
const glob = require('glob');
const es = require('event-stream');
const fs = require('fs');
const sharp = require('sharp');

const iconSizes = [16, 40, 48, 64, 128];

const destinationDirs = {
	js: 'extension/dist/js/',
	css: 'extension/dist/css/',
	icons: 'extension/dist/icons/',
	popup: 'extension/dist/popup/'
};

const path_icon = {
	default : 'src/icons/signTextLSF.svg',
	simple : 'src/icons/signTextLSF-simple.svg'
};

gulp.task('js', function(done) {

	glob('./src/js/**/*.js', (err, files) => {
		if (err) done(err);
		const tasks = files.map(entry =>
			browserify({
				entries : [entry],
				debug : true
			})
			.transform(
				babel.configure({
		      presets : ['env', 'es2015',]
		    })
			)
			.bundle()
			.pipe(source(entry.replace('src', 'extension/dist')))
			.pipe(buffer())
			.on('error', function(err){console.log(err)})
			.pipe(gulp.dest('./'))
		);
		es.merge(tasks).on('end', done);
	});

});


gulp.task('popup', function(done) {

	glob('./src/popup/**.*', (err, files) => {
		if (err) done(err);
		const tasks = files.map(entry => {
			if (/.js/.test(entry)) {
				return browserify({entries : [entry]})
					.transform(
						babel.configure({
				      presets : ['env', 'es2015',]
				    })
					)
					.bundle()
					.pipe(source(entry.replace('src', 'extension/dist')))
					.pipe(gulp.dest('./'))
			}
			else {
				return gulp.src(entry)
					.pipe(gulp.dest('./extension/dist/popup'))
			}
		});
		es.merge(tasks).on('end', done);
	});

});


gulp.task('css', function(done) {

	glob('./src/css/**/*.css', (err, files) => {
		if (err) done(err);
		const tasks = files.map(entry =>
			gulp.src(entry)
			.pipe(gulp.dest('./extension/dist/css'))
		);
		es.merge(tasks).on('end', done);
	});

});


gulp.task('browser-polyfill', () =>

	gulp
	// Source file
	.src('node_modules/webextension-polyfill/dist/browser-polyfill.js')
	// Output directory
	.pipe(gulp.dest(destinationDirs.js))

);


gulp.task('icons', gulp.series('browser-polyfill', function() {

	if (!fs.existsSync(destinationDirs.icons)) fs.mkdirSync(destinationDirs.icons);
	iconSizes.forEach(size => {
		size = +size;
		const source = size < 32 ? path_icon.simple : path_icon.default;
		console.log('Generating icon ' + size + 'x' + size);
		sharp(source)
		.resize(size, size)
		.toFile(destinationDirs.icons + 'signTextLSF-' + size + '.png');
	});

}));


gulp.task('watch', () => {

	gulp.watch('src/js/**/**.js', ['js']);
	gulp.watch('src/popup/**.*', ['popup']);
	gulp.watch('src/css/**/**.css', ['css']);

});


gulp.task('build', gulp.series('js', 'popup', 'css', 'icons'));


gulp.task('default', gulp.series('build', 'watch'));
