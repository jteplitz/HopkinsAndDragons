(function(){
  "use strict";

  var base = require("./base.js"),
      ViewClass = require("../views/EditGameStory.js"),
      async     = require("async"),
      _         = require("underscore"),

      EditGameStoryCtrl, _ptype,

      getGame, addBaseInfo;

  EditGameStoryCtrl = function(schemas, user, gameId){
    this.schemas = schemas;
    this.user    = user;
    this.gameId  = gameId;
    this.payload = {title: "Edit Story"};
    this._view   = new ViewClass();
  };

  _ptype = EditGameStoryCtrl.prototype = base.getProto("std");
  _ptype._name = "EditGameStory";

  _ptype.prePrep = function(data, cb){
    getGame(this, true)(function(err, game){
      if (err){return cb(err)}
      var mapSize = {
        height: 500,
        width: 800
      };
      // get the map size
      for (var i = 0; i < game.map.length; i++){
        var mapPiece = game.map[i];
        if (mapPiece.y > mapSize.height - 150){
          mapSize.height += 200;
        }

        if (mapPiece.x > mapSize.width - 150){
          mapSize.width += 200;
        }
      }

      data = _.extend(data, {game: game, mapSize: mapSize});
      cb();
    });
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

  _ptype.addPoint = function(pointInfo, cb){
    var self = this;
    getGame(self, false)(function(err, game){
      if (err) { return cb(err) }

      var storyPoint = new self.schemas.StoryPoint({
        x: pointInfo.x,
        y: pointInfo.y,
        enemy: pointInfo.enemy,
        text: pointInfo.text
      });
      game.story.push(storyPoint);
      game.save(function(err, game){
        cb(err, storyPoint);
      });
    });
  };

  _ptype.editPoint = function(id, pointInfo, cb){
    var self = this;
    getGame(self, false)(function(err, game){
      var point = game.story.id(id);
      for (var property in pointInfo){
        if(pointInfo.hasOwnProperty(property)){
          point[property] = pointInfo[property];
        }
      }
      game.save(function(err, game){
        cb(err, point);
      });
    });
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

  module.exports = EditGameStoryCtrl;
}());
