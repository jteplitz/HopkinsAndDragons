(function(){
  "use strict";

  var base = require("./base.js"),
      ViewClass = require("../views/EditGameEnemies.js"),
      _         = require("underscore"),
      async     = require("async"),

      EditGameEnemiesCtrl, _ptype,


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
      game: getGame(this),
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

  getBaseEnemies = function(self){
    return function(cb){
      self.schemas.BaseEnemy.find({}, cb);
    };
  };


  getGame = function(self){
    return function(cb){
      self.schemas.Game.findOne({_id: self.gameId}, function(err, game){
        if (err){ return cb(err) }

        if (_.isUndefined(game) || _.isNull(game)){
          return cb({msg: "No such game"});
        }

        if (game.owner !== self.user._id){ return cb({status: 401}) }

        cb(null, game);
      });
    };
  };

  module.exports = EditGameEnemiesCtrl;
}());
