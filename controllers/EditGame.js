(function(){
  "use strict";

  var base = require("./base.js"),
      ViewClass = require("../views/EditGame.js"),
      
      _         = require("underscore"),

      EditGameCtrl, _ptype;

  EditGameCtrl = function(schemas, gameId){
    this.payload = {title: ""};
    this._view   = new ViewClass();
  };

  _ptype = EditGameCtrl.prototype = base.getProto("std");
  _ptype._name = "EditGame";

  _ptype.prePrep = function(data, cb){
    this.schemas.game.findOne({_id: this.gameId}, function(err, game){
      if (err){ return cb(err) }

      if (_.isUndefined(game) || _.isNull(game)){
        console.log("game 404");
        return cb({msg: "No such game"});
      }

      data.game = game;
      cb();
    });
  };

  module.exports = EditGameCtrl;
}());
