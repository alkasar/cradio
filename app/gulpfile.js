var gulp = require('gulp');
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');

gulp.task('styles', function() {
	gulp.src('./resources/scss/**/*.scss')
		.pipe(plumber())
		.pipe(sass())
		.pipe(gulp.dest('./public/css/'));
});

//Watch task
gulp.task('default',function() {
	
	gulp.watch('./resources/scss/*.scss', ['styles']);
});