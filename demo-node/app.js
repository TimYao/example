var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var partials = require('express-partials');

var log = require('./models/log.js');
var session = require('express-session');
var store = require('connect-redis')(session);
var systemConfig = require('./conf/appconfig');
var check = require('./models/check.js');

var app = express();

//引入layout
app.use(partials()); 

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

//Session设置
var redisStore = systemConfig.sessionConfig.redisStore;
var secret = systemConfig.sessionConfig.secret;
var maxAge = systemConfig.sessionConfig.maxAge;
app.use(session({
  store: new store(redisStore),
  resave: false,
  saveUninitialized: true,
  secret: secret,
  cookie: {maxAge: maxAge}
}));

//静态资源文件
app.use(express.static(path.join(__dirname, 'public')));

//登录验证
app.all("*", check.checkLogin);

//beta_admin权限验证
app.all("*", check.checkAuthority);

//日志记录
app.all("*", log.insertLog);

require('express-autoroute')(app, {
  throwErrors: false,
  logger: require('winston')// logger
});

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.status(404);
  res.render('error/404', { error: '404 -- Not Found' });
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error/500', { error: err });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error/500', { error: err });
});


module.exports = app;
