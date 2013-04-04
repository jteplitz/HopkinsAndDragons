(function(){
  "use strict";

  var base = require("./base.js"),
      ViewClass = require("../views/EditGame.js"),
      _    = require("underscore"),
      async = require("async"),

      EditGameCtrl, _ptype,
      getGame, getBasePieces, getBasePiece;

  EditGameCtrl = function(user, gameId, schemas){
    this.user    = user;
    this.gameId  = gameId;
    this.schemas = schemas;

    this.payload = {title: ""};
    this._view   = new ViewClass();
  };

  _ptype = EditGameCtrl.prototype = base.getProto("std");
  _ptype._name = "EditGame";


  _ptype.prePrep = function(data, cb){
    var self = this;
    async.parallel({
      game: getGame(self),
      basePieces: getBasePieces(self)
      }, function(err, asyncData){
        if (err){ return cb(err) }

        _.extend(data, asyncData);
        cb();
    });
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

  getBasePieces = function(self){
    return function(cb){
      self.schemas.BaseMapPiece.find({}, cb);
    };
  };

  _ptype.addMapPiece = function(pieceData, cb){
    var self = this;

    async.parallel({
      game: getGame(self),
      basePiece: function(cb){ getBasePiece(self.schemas, pieceData.basePiece, cb) }
    }, function(err, data){
      if (err){ return cb(err) }

      var mapPiece = new self.schemas.MapPiece({
        image: data.basePiece.image,
        doorLeft: data.basePiece.doorLeft,
        doorRight: data.basePiece.doorRight,
        doorTop: data.basePiece.doorTop,
        doorBottom: data.basePiece.doorBottom,
        x: pieceData.x,
        y: pieceData.y,
        rotate: pieceData.rotate
      });
      data.game.map.push(mapPiece);
      data.game.save(function(err){
        cb(err, mapPiece);
      });
    });
  };

  _ptype.updateMapPiece = function(pieceId, data, cb){
    var self = this;
    this.schemas.Game.findOne({_id: self.gameId}, function(err, game){
      var piece = game.map.id(pieceId);
      for (var updateProperty in data){
        if (data.hasOwnProperty(updateProperty)){
          piece[updateProperty] = data[updateProperty];
        }
      }
      game.save(cb);
    });
  };

  _ptype.deleteMapPiece = function(pieceId, cb){
    this.schemas.Game.findOne({_id: this.gameId}, function(err, game){
      var piece = game.map.id(pieceId);
      if (_.isNull(piece)){
        return cb({error: 404, msg: "No such piece"});
      }
      piece.remove();
      game.save(cb);
    });
  };

  getBasePiece = function(schemas, pieceId, cb){
    schemas.BaseMapPiece.findOne({_id: pieceId}, cb);
  };
  module.exports = EditGameCtrl;
}());
