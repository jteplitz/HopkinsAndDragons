(function(){
  "use strict";

  var base      = require("./base.js"),
      ViewClass = require("../views/Game.js"),
      _         = require("underscore"),
      async     = require("async"),

      GameCtrl, _ptype,
      getGame, addBaseInfo;

  GameCtrl = function(schemas, user, gameId){
    this.schemas  = schemas;
    this.gameId   = gameId;
    this.user     = user;

    this.payload = {title: "Play Game!"};
    this._view   = new ViewClass();
    
    var self = this;
  };

  _ptype = GameCtrl.prototype = base.getProto("std");
  _ptype._name = "Game";


  _ptype.prePrep = function(data, cb){
    var self = this, i;
    getGame(this, true)(function(err, game){
      if (err){ return cb(err) }

      var mapSize = {
        height: 1000,
        width: 1600
      };
      // get the map size
      for (i = 0; i < game.map.length; i++){
        var mapPiece = game.map[i];
        if (mapPiece.y * 2 > mapSize.height - 150){
          mapSize.height += 200;
        }

        if (mapPiece.x * 2 > mapSize.width - 150){
          mapSize.width += 200;
        }
      }

      var playerId = "";
      // figure out which player we are
      for (i = 0; i < game.players.length; i++){
        if (game.players[i].owner === self.user._id){
          playerId = game.players[i]._id;
        }
      }

      _.extend(data, {game: game, mapSize: mapSize, your_id: playerId});
      cb();
    });
  };

  getGame = function(self, addBase){
    return function(cb){
      self.schemas.Game.findOne({_id: self.gameId}, function(err, game){
        var i;
        if (err){ return cb(err) }

        if (_.isUndefined(game) || _.isNull(game)){
          return cb({msg: "No such game"});
        }

        // make sure they are either a player or an owner
        if (game.owner !== self.user._id){
          var valid = false;
          for (i = 0; i < game.players.length; i++){
            if (game.players[i].owner === self.user._id){
              valid = true;
            }
          }
          if (!valid){
            return cb({status: 401});
          }
        }

        if (addBase){
          // put the base enemy info in the enemies
          var async_arr = [];
          for (i = 0; i < game.enemies.length; i++){
            async_arr.push(addBaseInfo(self, game.enemies[i]));
          }
          async.parallel(async_arr, function(err, data){
            if (err){ return cb(err) }
            game = game.toObject();

            game.enemies = data;
            cb(err, game);
          });
        } else {
          cb(err, game);
        }
      });
    };
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
 

  module.exports = GameCtrl;
}());
