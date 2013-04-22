(function(){
  "use strict";

  var base      = require("./base.js"),
      ViewClass = require("../views/EditGamePlayers.js"),
      _         = require("underscore"),
      async     = require("async"),

      EditGamePlayersCtrl, _ptype,
      getGame, addBaseInfo, getUser;

  EditGamePlayersCtrl = function(schemas, user, gameId){
    this.schemas = schemas;
    this.user    = user;
    this.gameId  = gameId;

    this.payload = {title: "Setup Players"};
    this._view   = new ViewClass();
  };

  _ptype = EditGamePlayersCtrl.prototype = base.getProto("std");
  _ptype._name = "EditGamePlayers";

  _ptype.prePrep = function(data, cb){
    var self = this;
    getGame(this, false)(function(err, game){
      if (err){ return cb(err) }
      data.game = game;

      // organize the players
      var players = {
        Rogue: "",
        Sorcerer: "",
        Tinkerer: "",
        Knight: ""
      };
      var asyncPlayers = {};
      for (var i = 0; i < game.players.length; i++){
        if (_.has(players, game.players[i].name)){
          //players[game.players[i].name] = game.players[i].owner;
          asyncPlayers[game.players[i].name] = getUser(self.schemas, game.players[i].owner);
        }
      }

      async.parallel(asyncPlayers, function(err, dbPlayers){
        if (err){ return cb(err) }

        for (var player in dbPlayers){
          if (dbPlayers.hasOwnProperty(player)){
            players[player] = dbPlayers[player].email;
          }
        }

        data.players = players;
        cb();
      });
    });
  };

  getUser = function(schemas, id){
    return function(cb){
      schemas.User.findOne({_id: id}, cb);
    };
  };

  getGame = function(self, addBase){
    return function(cb){
      self.schemas.Game.findOne({_id: self.gameId}, function(err, game){
        if (err){ return cb(err) }

        if (_.isUndefined(game) || _.isNull(game)){
          return cb({msg: "No such game"});
        }

        if (game.owner !== self.user._id){ return cb({status: 401}) }

        if (addBase){
          // put the base enemy info in the enemies
          var async_arr = [];
          for (var i = 0; i < game.enemies.length; i++){
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
        cb(null, enemy);
      });
    };
  };

  module.exports = EditGamePlayersCtrl;
}());
