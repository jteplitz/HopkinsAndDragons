(function(){
  "use strict";

  /**
   * Module dependencies.
   */

  var express = require('express'),
      routeList = require('./routes'),
      http = require('http'),
      schemas = require("./app/schemas.js"),
      auth    = require("./app/auth.js"),
      mongoose = require("mongoose"),
      MongoStore = require("connect-mongo")(express),
      conf      = require('nconf').argv().env().file({file: __dirname + '/config.json'}),
      _ = require("underscore"),
      io        = require("socket.io"),
      GameController = require("./controllers/Game.js"),
      path = require('path');

  var app = express(), server;

  mongoose.connect(conf.get("mongo"));

  mongoose.connection.on("open", function(){
    app.configure(function(){
      app.set('port', process.env.PORT || 3000);
      app.set('views', __dirname + '/templates');
      app.set('view engine', 'jade');
      app.use(express.favicon());
      app.use(express.logger('dev'));
      app.use(express.bodyParser({
        uploadDir: __dirname + "/public/upload/"
      }));
      app.use(express.methodOverride());
      app.use(express.cookieParser('your secret here'));
      app.use(express.session({
        store: new MongoStore({db: mongoose.connection.db})
      }));
      app.use(app.router);
      app.use(require('less-middleware')({ src: __dirname + '/public' }));
      app.use(express["static"](path.join(__dirname, 'public')));
      // handles 404s. Has to be last
      app.use(function(req, res, next){
        res.render("404", {title: "Dead link", loggedIn: req.session.valid, globals: {}});
      });
    });

    app.configure('development', function(){
      app.use(express.errorHandler());
    });

    _.each(routeList.routes, function(route){
      var methods = route[6] || ["get"];

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
            next();
          });
        }

        if (route[4]){
          params.push(function(req, res, next){
            req._io = io;
            next();
          });
        }

        params.push(auth(conf, route[4]));

        app[method](route[0], params, route[1]);
      });
    });


    server = http.createServer(app).listen(app.get('port'), function(){
      console.log("Express server listening on port " + app.get('port'));
    });
    io = io.listen(server);
    // send a socket.io request to the game controller
    io.sockets.on("connection", function(socket){
      var controller = new GameController(schemas, socket, null, null); // TODO hook up session info for user and game id
      socket.on("position", function(data){
        io.sockets["in"]("/game/null").emit("position", data);
      });
    });
 });
}());
