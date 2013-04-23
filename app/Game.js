/*globals dragons*/
(function(){
  "use strict";

  var _ = require("underscore"),
      conf = require('nconf').argv().env().file({file: __dirname + '/../config.json'}),

      Game, _ptype,

      // physics stuff
      physicsUpdateTime = conf.get("gameGlobals:physicsUpdateTime"),
      gameUpdateTime    = conf.get("gameGlobals:serverSyncTime");

      // load the game classes
      require("../public/javascripts/canvas.js");
  
  Game = function(id, gameInfo, sockets){
    this.gameId   = id;
    this.gameInfo = gameInfo;
    this.sockets  = sockets;
    this.players  = [];
    this.room     = "/game/" + id;
    this.clients  = [];

    this._dt = 0;
    this._dte = 0;
    this.local_time = 0;

    this.canvas = new dragons.canvas(null, conf);

    setInterval(this.physicsUpdate.bind(this), physicsUpdateTime);
    setInterval(this.gameUpdate.bind(this), gameUpdateTime);
    setInterval(this.updateTimers.bind(this), 4);
  };

  _ptype = Game.prototype;

  _ptype.physicsUpdate = function(){
  };

  _ptype.gameUpdate = function(){
    var gameState = {
      time: this.localTime
    };
    this.sockets["in"](this.room).emit("update", gameState);
  };

  _ptype.updateTimers = function(){
    this._dt         = new Date().getTime() - this._dte;
    this._dte        = new Date().getTime();
    this.local_time += this._dt/1000.0;
  };

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
    this.sockets["in"](this.room).emit("start", {time: this.local_time});
  };

  _ptype.handleInput = function(){
  };

  module.exports = Game;
}());
