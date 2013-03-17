
/**
 * Module dependencies.
 */

var express = require('express'),
    routeList = require('./routes'),
    http = require('http'),
    schemas = require("./app/schemas.js"),
    auth    = require("./app/auth.js"),
    conf      = require('nconf').argv().env().file({file: __dirname + '/config.json'}),
    _ = require("underscore"),
    path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/templates');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express["static"](path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

_.each(routeList.routes, function(route){
  var methods = route[5] || ["get"];

  methods.forEach(function(method){
    var params = [];

    if (route[2]){
      params.push(function(req, res, next){
        req._schemas = schemas;
        next();
      });
    }
    if (route[3]){
      params.push(function(req, res, next){
        req._conf = conf;
      });
    }

    params.push(auth(conf, route[4]));

    console.log("adding", route[0], route[1]);
    app[method](route[0], params, route[1]);
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
