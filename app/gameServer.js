(function(){
  "use strict";

  var _    = require("underscore"),
      Game = require("./Game.js"),

      gameServer, _ptype;

  gameServer = function(conf, schemas){
    this.conf    = conf;
    this.schemas = schemas;

    this.games = {};
    this.gameCount = 0;
  };

  _ptype = gameServer.prototype;

  _ptype.joinGame = function(client, user, data){
    var self = this;

    var gameId = data.gameId;
    console.log("recieved a request to join game: " + gameId);

    // make sure this is a valid join request
    self.schemas.Game.findOne({_id: gameId}, function(err, game){
      if (err){ return client.emit("error", {err: 500, msg: "Sorry, something went wrong while joining the game."}) }

      if (_.has(self.games, gameId)){
        // the game exists
          // make sure they are either a player or an owner
          if (game.owner !== self.user._id){
            var valid = false;
            for (var i = 0; i < game.players.length; i++){
              if (game.players[i] === self.user._id){
                valid = true;
              }
            }
            if (!valid){
              return client.emit("error", {err: 401, msg: "You are not allowed to join that game"});
            }
          }

          // this is valid. Join (or create) the game
          if (_.has(self.games, gameId)){
            self.games[gameId].addClient(client);
          } else {
            game = new Game(gameId, game);
            game.addClient(client);
            self.games[gameId] = game;
          }
      }
    });
  };


  module.exports = gameServer;
}());
