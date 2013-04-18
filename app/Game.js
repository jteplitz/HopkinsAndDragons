(function(){
  "use strict";

  var _ = require("underscore"),

      Game, _ptype;
  
  Game = function(id, gameInfo, sockets){
    this.gameId   = id;
    this.gameInfo = gameInfo;
    this.sockets  = sockets;
    this.room     = "/game/" + id;
    this.clients  = [];
  };

  _ptype = Game.prototype;

  _ptype.addClient = function(client){
    this.clients.push(client);
    client.join(this.room);
    client.emit("connected", {gameId: this.gameId, clientCount: this.clients.length});
    console.log("connected to", this.room);

    if(this.clients.length ===  2){
      // we're ready to go
      this.start();
    }
  };

  _ptype.start = function(){
    console.log("sending message to", this.room);
    this.sockets["in"](this.room).emit("start");
  };

  module.exports = Game;
}());
