(function(){
  "use strict";

  var base = require("./base.js"),
      ViewClass = require("../views/Games.js"),

      _ = require("underscore"),

      GamesCtrl, _ptype;

  GamesCtrl = function(schemas, user){
    this.schemas = schemas;
    this.user    = user;

    this.payload = {title: "Your Games"};
    this._view   = new ViewClass();
  };

  _ptype = GamesCtrl.prototype = base.getProto("std");
  _ptype._name = "Games";

  _ptype.prePrep = function(data, cb){
    var query = this.schemas.Game.find();
    query.or([
      //this.schemas.Game.find().in({players: this.user._id}),
      {players: this.user._id},
      {owner: this.user._id}
    ]);
    query.exec(function(err, results){
      if (err){ return cb(err) }
      if (_.isNull(results) || _.isUndefined(results)){
        results = [];
      }

      data.games = results;
      cb();
    });
  };

  // TODO: game _id's should be monotonic numbers
  _ptype.createGame = function(gameData, cb){
    var game = new this.schemas.Game({
      name: gameData.name,
      players: gameData.owners,
      owner: this.user._id
    });

    game.save(cb);
  };

  module.exports = GamesCtrl;
}());
