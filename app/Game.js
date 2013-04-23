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
      var dragons = require("../public/javascripts/canvas.js");
  
  Game = function(id, gameInfo, sockets){
    this.gameId   = id;
    this.gameInfo = gameInfo;
    this.sockets  = sockets;
    this.players  = {};
    this.room     = "/game/" + id;
    this.clients  = [];

    this._dt = 0;
    this._dte = 0;
    this.localTime = 0;

    var mapSize = {
      height: 1000,
      width: 1600
    };
    // get the map size
    for (var i = 0; i < gameInfo.map.length; i++){
      var mapPiece = gameInfo.map[i];
      if (mapPiece.y * 2 > mapSize.height - 150){
        mapSize.height += 200;
      }

      if (mapPiece.x * 2 > mapSize.width - 150){
        mapSize.width += 200;
      }
    }

    this.canvas = new dragons.canvas({width: mapSize.width, height: mapSize.height}, conf);

    setInterval(this.physicsUpdate.bind(this), physicsUpdateTime);
    setInterval(this.gameUpdate.bind(this), gameUpdateTime);
    setInterval(this.updateTimers.bind(this), 4);

    // setup the players
    for (i = 0; i < this.gameInfo.players.length; i++){
      var currPlayer = this.gameInfo.players[i];
      var player = new dragons.gameElements.Player(null, 50, 50, currPlayer.x, currPlayer.y, currPlayer.name, currPlayer._id);
      this.canvas.addElement(player);
      this.players[currPlayer._id] = this.canvas.elements[this.canvas.elements.length - 1];
    }
  };

  _ptype = Game.prototype;

  _ptype.physicsUpdate = function(){
    this.canvas.update();
  };

  _ptype.gameUpdate = function(){
    var playerPositions = {};
    for (var player in this.players){
      if (this.players.hasOwnProperty(player)){
        playerPositions[this.players[player]._id] = {
          x: this.players[player].x,
          y: this.players[player].y
        };
      }
    }
    var gameState = {
      time: this.localTime,
      pos: playerPositions
    };
    console.log("sending game state", gameState);
    this.sockets["in"](this.room).emit("update", gameState);
  };

  _ptype.updateTimers = function(){
    this._dt         = new Date().getTime() - this._dte;
    this._dte        = new Date().getTime();
    this.localTime += this._dt/1000.0;
  };

  _ptype.addClient = function(client){
    this.clients.push(client);
    client.join(this.room);
    client.emit("connected", {gameId: this.gameId, clientCount: this.clients.length});
    console.log("connected to", this.room);

    if(this.clients.length >=  2){
      // we're ready to go
      this.start();
    }
  };

  _ptype.start = function(){
    console.log("starting game");
    this.sockets["in"](this.room).emit("start", {time: this.localTime});
  };

  _ptype.handleInput = function(data, client){
    if (client.player_id === null){ return; } // owners can't play
    var player = this.players[client.player_id];
    player.inputs.push({
      inputs: data.inputs,
      seq: data.seq,
      time: data.time
    });
  };

  module.exports = Game;
}());
