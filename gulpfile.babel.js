import { src, dest, watch, series, parallel } from "gulp";
import pug from "gulp-pug";
import sass from "gulp-sass";
import autoprefixer from "gulp-autoprefixer";
import cleanCss from "gulp-clean-css";
import browserify from "gulp-bro";
import rename from "gulp-rename";
import clean from "gulp-clean";
import plumber from "gulp-plumber";
import browserSync from "browser-sync";

const browser = browserSync.create();

const docsJs = () =>
	src("src/docs/js/index.js")
		.pipe(plumber())
		.pipe(
			browserify({
				transform: [
					[
						"babelify",
						{
							presets: ["@babel/preset-env"],
							plugins: [
								"@babel/plugin-transform-runtime",
								"transform-export-extensions",
								"@babel/plugin-proposal-export-default-from"
							]
						}
					],
					[
						"vueify",
						{
							sass: {
								includePaths: ["node_modules"]
							}
						}
					],
					"envify",
					"brfs"
				],
				plugin: ["tinyify"]
			})
		)
		.pipe(
			rename({
				suffix: ".min"
			})
		)
		.pipe(dest("docs/js"))
		.pipe(dest("docs/material-components-web-vue/js"))
		.pipe(browser.stream());

const docsHtml = () =>
	src("src/docs/html/index.pug")
		.pipe(plumber())
		.pipe(pug())
		.pipe(dest("docs"))
		.pipe(browser.stream());

const docsCss = () =>
	src("src/docs/css/index.sass")
		.pipe(plumber())
		.pipe(
			sass({
				includePaths: ["node_modules"]
			})
		)
		.pipe(autoprefixer())
		.pipe(cleanCss())
		.pipe(
			rename({
				suffix: ".min"
			})
		)
		.pipe(dest("docs/css"))
		.pipe(dest("docs/material-components-web-vue/css"))
		.pipe(browser.stream());

const libCss = () =>
	src("src/css/*.sass")
		.pipe(plumber())
		.pipe(dest("lib/css"))
		.pipe(browser.stream());

const libJs = () =>
	src("src/js/**/*.{vue,js}")
		.pipe(plumber())
		.pipe(dest("lib/js"))
		.pipe(browser.stream());

const clearDocs = () =>
	src("docs", { allowEmpty: true })
		.pipe(plumber())
		.pipe(clean());

const clearLib = () =>
	src("lib", { allowEmpty: true })
		.pipe(plumber())
		.pipe(clean());

const reload = done => {
	browser.reload();

	done();
};

const build = series(clearDocs, clearLib, parallel(libCss, libJs), parallel(docsJs, docsHtml, docsCss));

const start = () => {
	browser.init({
		server: {
			baseDir: "docs"
		}
	});

	watch("src/js/**/*.{vue,js}", series(libJs, docsJs, reload));
	watch("src/docs/js/**/*.{vue,js}", series(docsJs, reload));
	watch("src/css/**/*.sass", series(libCss, docsCss, reload));
	watch("src/docs/css/**/*.sass", series(docsCss, reload));
	watch("src/docs/html/**/*.pug", series(docsHtml, reload));
};

export { start, build };
