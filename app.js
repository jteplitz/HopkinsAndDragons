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
      Sio       = require("session.socket.io"),
      GameServer = require("./app/gameServer.js"),
      path = require('path'),
      fakeLag = parseInt(conf.get("gameGlobals:fakeLag"), 10);

  var app = express(), server,
      sessionStore, sockets, gameServer, setupNewClient;

  mongoose.connect(conf.get("mongo"));

  mongoose.connection.on("open", function(){
    sessionStore = new MongoStore({db: mongoose.connection.db});
    app.configure(function(){
      app.set('port', conf.get("PORT") || 3000);
      app.set('views', __dirname + '/templates');
      app.set('view engine', 'jade');
      app.use(express.favicon());
      app.use(express.logger('dev'));
      app.use(express.bodyParser({
        uploadDir: __dirname + "/public/upload/"
      }));
      app.use(express.methodOverride());
      app.use(express.cookieParser(conf.get("secret")));
      app.use(express.session({
        store: sessionStore
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
    io.set("log level", "2");
    sockets = new Sio(io, sessionStore, express.cookieParser(conf.get("secret")));

    // setup the Game Server
    gameServer = new GameServer(conf, schemas, io.sockets);


    sockets.on("connection", function(err, client, session){
      var game =  null;
      client.on("ping", function(data){
        client.emit("ping", data);
      });
      client.on("join", function(data){
        game = gameServer.joinGame(client, session.user, data, function(err, joinedGame){
          if (err){ return client.emit("error", err); }
          console.log("joined game", joinedGame.randomId);
          game = joinedGame;
          setupNewClient(game, client);
        });
      });
    });
 });
  setupNewClient = function(game, client){
    console.log("setting up", client.user._id);
    client.on("input", function(data){
      if (fakeLag > 0){
        setTimeout(function(){ game.handleInput(data, client) }, fakeLag);
      } else {
        game.handleInput(data, client);
      }
    });
    client.on("equip", function(data){
      game.handleEquip(data, client);
    });
    client.on("attack", function(data){
      game.handleAttack(data, client);
    });
    client.on("disconnect", function(){
      console.log("got disconnect");
      gameServer.leaveGame(game, client);
      game = null;
    });
  };
}());
