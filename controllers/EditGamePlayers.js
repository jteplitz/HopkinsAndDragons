(function(){
  "use strict";

  var base      = require("./base.js"),
      ViewClass = require("../views/EditGamePlayers.js"),
      _         = require("underscore"),
      async     = require("async"),

      EditGamePlayersCtrl, _ptype,
      getGame, addBaseInfo, getUser, getUserByEmail;

  EditGamePlayersCtrl = function(schemas, conf, user, gameId){
    this.schemas = schemas;
    this.conf    = conf;
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
      var gamePlayers = game.players.toObject();
      console.log("got players", gamePlayers);
      for (var i = 0; i < gamePlayers.length; i++){
        if (_.has(players, gamePlayers[i].name)){
          //players[gamePlayers[i].name] = gamePlayers[i].owner;
          if (!_.has(gamePlayers[i], "owner") || gamePlayers[i].owner === null){
            continue;
          }

          asyncPlayers[gamePlayers[i].name] = getUser(self.schemas, gamePlayers[i].owner);
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

  _ptype.changePlayers = function(players, cb){
    var self = this;
    // get the players and the game
    var asyncPlayers = {game: getGame(self, false)};
    for (var player in players){
      if (players.hasOwnProperty(player) && players[player] !== null){
        asyncPlayers[player] = getUserByEmail(self.schemas, players[player]);
      }
    }
    async.parallel(asyncPlayers, function(err, data){
      if (err){ return cb(err) }
      var game = data.game;
      
      // modify the players that already exist
      for (var i = 0; i < game.players.length; i++){
        if (_.has(data, game.players[i].name)){
          game.players[i].owner = data[game.players[i].name]._id;
          delete data[game.players[i].name];
        }
      }
      // add the other players
      for (var player in data){
        // load up their first two attacks as defaults
        if (data.hasOwnProperty(player) && player !== "game"){
          var attackList = self.conf.get("players:" + player + ":attacks"), attacks = [];
          for (var attack in attackList){
            if (attackList.hasOwnProperty(attack) && attacks.length < 2){
              attacks.push(attack);
            }
          }
          game.players.push(new self.schemas.Player({
            x: 20,
            y: 20,
            attacks: attacks,
            health: 50,
            name: player,
            image: self.conf.get("players:" + player + ":image"),
            owner: data[player]._id,
            level: 1
          }));
        }
      }
      game.save(cb);
    });
  };

  getUser = function(schemas, id){
    return function(cb){
      schemas.User.findOne({_id: id}, cb);
    };
  };

  getUserByEmail = function(schemas, email){
    return function(cb){
      schemas.User.findOne({email: email}, cb);
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
