(function(){
  "use strict";

  var _     = require("underscore"),
      Game  = require("./Game.js"),
      async = require("async"),

      gameServer, _ptype, addBaseInfo;

  gameServer = function(conf, schemas, sockets){
    this.conf     = conf;
    this.schemas  = schemas;
    this.sockets  = sockets;

    this.games = {};
  };

  _ptype = gameServer.prototype;

  _ptype.joinGame = function(client, user, data, cb){
    var self = this, i,
        gameId = data.gameId;

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
            for (i = 0; i < game.players.length; i++){
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
            if (self.games[gameId].addClient(client)){
              cb(null, self.games[gameId]);
            } else {
              cb({err: 400, msg: "Unable to connect. You're already connected to this game"});
            }
          } else {
            // add the enemy base info
            var async_arr = [];
            for (i = 0; i < game.enemies.length; i++){
              async_arr.push(addBaseInfo(self, game.enemies[i]));
            }
            // get the info in parallel from the db
            // TODO: it's probably more efficient for large games to get all the base enemies from the db
            //       and then pair them to enemies as opposed to accessing the db one by one
            async.parallel(async_arr, function(err, data){
              if (err){ return cb(err) }
              var gameInfo = game.toObject();
              gameInfo.enemies = data; // this may not work for mongoosey reasons
              game = new Game(gameId, game, gameInfo, self.sockets);
              game.addClient(client);
              self.games[gameId] = game;
              cb(null, game);
            });
          }
      }
    });
  };

  _ptype.leaveGame = function(game, client){
    var self = this;
    game.removeClient(client);
    if (game.clients.length === 0){
      console.log("removing game", game.gameId);
      this.games[game.gameId].destroy(function(err){
        delete self.games[game.gameId];
      });
    }
  };

  addBaseInfo = function(self, enemy){
    enemy = enemy.toObject(); // we just want the properties, not the fancy mongoose stuff
    return function(cb){
      self.schemas.BaseEnemy.findOne({_id: enemy.baseEnemy}, function(err, baseEnemy){
        if (err){ return cb(err) }

        enemy.baseEnemy = baseEnemy;
        console.log("saved", enemy);
        cb(null, enemy);
      });
    };
  };


  module.exports = gameServer;
}());
