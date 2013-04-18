(function(){
  "use strict";

  var _ = require("underscore"),

      Game, _ptype;
  
  Game = function(id, gameInfo){
    this.gameId   = id;
    this.gameInfo = gameInfo;
    this.clients  = [];
  };

  _ptype = Game.prototype;

  _ptype.addClient = function(client){
    this.clients.push(client);
    if(this.clients.length ===  2){
      // we're ready to go
      this.start();
    }
  };

  _ptype.start = function(){
  };

  module.exports = Game;
}());
