const gulp = require('gulp');
const stylus = require('gulp-stylus');
const concat = require('gulp-concat');
const runElectron = require('gulp-run-electron');
const notify = require('gulp-notify');
const plumber = require('gulp-plumber');
const sourcemaps = require('gulp-sourcemaps');
// const gulpWebpack = require('webpack-stream');
// const webpack = require('webpack');

// const webpackConfig = {
// 	devtool: 'eval',
// 	watchOptions: { ignored: /node_modules/ },
// 	entry: { index: './src/index.js' },
// 	resolve: { extensions: ['.js', '.json'] },
// 	output: {
// 		libraryTarget: 'commonjs2',
// 		filename: '[name].js'
// 	},
// 	module: {
// 		// exprContextCritical: false,
// 		rules: [{
// 			test: /\.js$/,
// 			exclude: /node_modules/,
// 			use: { loader: 'babel-loader', options: { presets: ['electron'] } }
// 		}]
// 	},
// 	target: 'electron',
// 	externals: [
// 		'fs',
// 		'path',
// 		'child_process',
// 		'electron',
// 		'electron-store',
// 	],
// 	// plugins: [ new webpack.optimize.UglifyJsPlugin() ]
// };



gulp.task('html', () => gulp
	.src('src/*.html')
	.pipe(gulp.dest('app/'))
);


gulp.task('js', () => gulp
	.src('src/**/*.js')
	// .pipe(gulpWebpack(webpackConfig))
	.pipe(plumber({errorHandler: notify.onError('JS: <%= error.message %>')}))
	.pipe(gulp.dest('app/'))
);


gulp.task('css', () => gulp
	.src('src/**/*.styl')
	.pipe(sourcemaps.init())
	.pipe(plumber({errorHandler: notify.onError('Stylus: <%= error.message %>')}))
	.pipe(stylus({ include: __dirname + '/src'}))
	.pipe(concat('index.css'))
	.pipe(sourcemaps.write())
	.pipe(gulp.dest('app/'))
);

gulp.task('electron', ['build'], () => gulp
	.src('./')
	.pipe(runElectron())
);

gulp.task('build', ['js', 'css', 'html']);


gulp.task('w', ['build'], () => {
	gulp.watch('src/*.html', ['html']);
	gulp.watch('src/**/*.styl', ['css']);
	gulp.watch('src/**/*.js', ['js']);
});

gulp.task('a', ['electron'], () => {
	gulp.watch('src/*.html', ['html']);
	gulp.watch('src/**/*.styl', ['css']);
	gulp.watch('src/**/*.js', ['js']);
});


gulp.task('default', ['a']);

