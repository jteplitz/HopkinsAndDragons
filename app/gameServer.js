(function(){
  "use strict";

  var _    = require("underscore"),
      Game = require("./Game.js"),

      gameServer, _ptype;

  gameServer = function(conf, schemas, sockets){
    this.conf    = conf;
    this.schemas = schemas;
    this.sockets = sockets;

    this.games = {};
    this.gameCount = 0;
  };

  _ptype = gameServer.prototype;

  _ptype.joinGame = function(client, user, data, cb){
    var self = this;

    var gameId = data.gameId;

    // make sure this is a valid join request
    self.schemas.Game.findOne({_id: gameId}, function(err, game){
      if (err){
        client.emit("error", {err: 500, msg: "Sorry, something went wrong while joining the game."});
        return cb({err: 500});
      }

      if (!_.isUndefined(game) && !_.isNull(game)){
        // the game exists
          // make sure they are either a player or an owner
          if (game.owner !== user._id){
            var valid = false;
            for (var i = 0; i < game.players.length; i++){
              if (game.players[i].owner === user._id){
                valid = true;
                client.player_id = game.players[i]._id;
              }
            }
            if (!valid){
              client.emit("error", {err: 401, msg: "You are not allowed to join that game"});
              return cb({err: 401});
            }
          } else if (game.owner === user._id){
            // I guess owners watch...?
            client.player_id = null;
          }
          client.user = user;

          // this is valid. Join (or create) the game
          var added = true;
          if (_.has(self.games, gameId)){
            added = self.games[gameId].addClient(client);
          } else {
            game = new Game(gameId, game, self.sockets);
            game.addClient(client);
            self.games[gameId] = game;
          }
          if (added){
            cb(null, self.games[gameId]);
          } else {
            cb({err: 400, msg: "Unable to connect. You're already connected to this game"});
          }
      }
    });
  };

  _ptype.leaveGame = function(game, client){
    var self = this;
    game.removeClient(client);
    if (game.clients.length === 0){
      console.log("removing game", game.gameId);
      this.games[game.gameId].destroy(function(){
        delete self.games[game.gameId];
      });
    }
  };


  module.exports = gameServer;
}());
