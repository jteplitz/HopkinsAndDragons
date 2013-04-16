(function(){
  "use strict";

  var base = require("./base.js"),
      ViewClass = require("../views/EditGameEnemies.js"),
      _         = require("underscore"),
      async     = require("async"),

      EditGameEnemiesCtrl, _ptype, addBaseInfo,


      getGame, getBaseEnemies;

  EditGameEnemiesCtrl = function(user, gameId, schemas){
    this.user    = user;
    this.gameId  = gameId;
    this.schemas = schemas;

    this.payload = {title: "Edit Enemies"};
    this._view   = new ViewClass();
  };

  _ptype = EditGameEnemiesCtrl.prototype = base.getProto("std");
  _ptype._name = "EditGameEnemies";

  _ptype.prePrep = function(data, cb){
    async.parallel({
      game: getGame(this, true),
      baseEnemies: getBaseEnemies(this)
    }, function(err, asyncData){
      if (err){ return cb(err) }

      var mapSize = {
        height: 500,
        width: 800
      };
      // get the map size
      for (var i = 0; i < asyncData.game.map.length; i++){
        var mapPiece = asyncData.game.map[i];
        if (mapPiece.y > mapSize.height - 150){
          mapSize.height += 200;
        }

        if (mapPiece.x > mapSize.width - 150){
          mapSize.width += 200;
        }
      }

      data = _.extend(data, asyncData, {mapSize: mapSize});
      cb();
    });
  };

  _ptype.createEnemy = function(enemyData, cb){
    var self = this;
    getGame(this, false)(function(err, game){
      if (err){ return cb(err) }

      var enemy = new self.schemas.Enemy({
        x: enemyData.x,
        y: enemyData.y,
        pullRadius: enemyData.pullRadius,
        baseEnemy: enemyData.baseEnemy
      });
      game.enemies.push(enemy);
      game.save(function(err, game){
        cb(err, enemy);
      });
    });
  };

  _ptype.editEnemy = function(enemyId, enemyData, cb){
    getGame(this, false)(function(err, game){
      if (err){ return cb(err) }

      var enemy = game.enemies.id(enemyId);
      for (var property in enemyData){
        if (enemyData.hasOwnProperty(property)){
          enemy[property] = enemyData[property];
        }
      }
      game.save(function(err, game){
        cb(err, enemy);
      });
    });
  };

  getBaseEnemies = function(self){
    return function(cb){
      self.schemas.BaseEnemy.find({}, cb);
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
        console.log("saved", enemy);
        cb(null, enemy);
      });
    };
  };

  module.exports = EditGameEnemiesCtrl;
}());
