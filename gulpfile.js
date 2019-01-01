var gulp = require("gulp"),
  sass = require("gulp-sass"),
  concat = require("gulp-concat"),
  plumber = require("gulp-plumber"),
  base64 = require("gulp-base64"),
  babel = require("gulp-babel"),
  uglify = require("gulp-uglify"),
  autopre = require("gulp-autoprefixer"),
  del = require("del"),
  zip = require("gulp-zip"),
  nwBuilder = require("nw-builder"),
  info = require("./package"),
  browserSync = require("browser-sync").create(),
  reload = browserSync.reload;
var exec = require("child_process").exec;
const path = require('path');
// 配置了sass,自动添加前缀,重命名添加min后缀,压缩css
gulp.task("css", function() {
  gulp
    .src("./src/sass/*.scss")
    // .pipe(plugins.sass())
    .pipe(sass().on("error", sass.logError))
    .pipe(autopre())
    .pipe(
      base64({
        extensions: ["svg", "png", /\.jpg#datauri$/i],
        maxImageSize: 8 * 1024 // bytes
      })
    )
    // .pipe(gulp.dest("./src/css"))
    // .pipe(plugins.rename({ suffix: '.min' }))
    // .pipe(plugins.cleanCss())
    .pipe(gulp.dest("./dist/css"))
    .pipe(reload({ stream: true }));
});
gulp.task("clean", function(cb) {
  return del(["dist/*"], cb);
});
gulp.task("html", function() {
  gulp.src("./src/*.html").pipe(gulp.dest("./dist"));
});
gulp.task("js", ["assets"], function() {
  gulp
    .src("./src/js/**/*.js")
    .pipe(plumber())
    .pipe(babel())
    .pipe(gulp.dest("./dist/js"));
});
gulp.task("assets", function() {
  gulp.src("./src/assets/**").pipe(gulp.dest("./dist/assets"));
});
gulp.task("image", function() {
  gulp.src("./src/img/**/*").pipe(gulp.dest("./dist/img"));
});
// 静态服务器 + 监听 scss/html 文件
gulp.task("serve", ["clean"], function() {
  gulp.start("js", "html", "css", "image", "assets");
  browserSync.init({
    server: {
      baseDir: "./dist/"
    },
    host: "127.0.0.1"
  });
  gulp.watch("src/img/**/*", ["image"]);
  gulp.watch("src/sass/*.scss", ["css"]);
  // gulp.watch("dist/*.html").on('change', reload);
  gulp.watch("./src/*.html").on("change", reload);
  gulp.watch("./src/*.html", ["html"]);
  gulp.watch("./src/**/*.js", ["js"]);
});
// gulp.task('build',['styles']);
// gulp.task('watch',function () {
//     gulp.watch(['sass/*.scss'],['styles']);
// })
gulp.task("default", ["serve"]);
// nwBuilder
var depends = require('./depends').depends;

gulp.task("build", ["css", "html", "js"], cb => {
  var nw = new nwBuilder({
    files: "./{package.json,dist/**,node_modules/{" + depends + "}/**}", // use the glob format
    platforms: ["osx64", "win32", "win64"],
    version: "0.14.7",
    flavor: "normal"
  });
  nw.on("log", console.log);
  nw.build(cb);
});
gulp.task("run", ["css", "html", "js"], cb => {
  var nw = new nwBuilder({
    files: "./{package.json,dist/**,node_modules/{" + depends + "}/**}", // use the glob format
    platforms: ["win64"],
    version: "0.14.7"
  });
  nw.build().then(() => {
    exec(path.join(__dirname,'./build/ocr/win64/ocr.exe'));
  });
});
gulp.task("release", ["build"], function() {
  return gulp
    .src(["./src/shell/*", "./build/nwMusicBox/linux64/**"])
    .pipe(zip(info.version + "linux64.zip"))
    .pipe(gulp.dest("./release/" + info.version));
});
