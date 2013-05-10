/*globals dragons*/
(function(){
  "use strict";

  var _ = require("underscore"),
      Canvas = require("canvas"),
      conf = require('nconf').argv().env().file({file: __dirname + '/../config.json'}),

      Game, _ptype, organizeMovements,

      // physics stuff
      physicsUpdateTime = conf.get("gameGlobals:physicsUpdateTime"),
      gameUpdateTime    = conf.get("gameGlobals:serverSyncTime"),
      playerSight       = parseInt(conf.get("gameGlobals:playerSight"), 10),
      saveGameTime      = conf.get("gameGlobals:saveGameTime");

      // load the game classes
      var dragons = require("../public/javascripts/canvas.js"),
          fog     = require("../public/javascripts/fog.js");
  
  Game = function(id, gameInfo, sockets){
    this.gameId    = id;
    this.randomId  = Math.random() * 100;
    this.gameInfo  = gameInfo;
    this.sockets   = sockets;
    this.players   = {};
    this.room      = "/game/" + id;
    this.clients   = [];
    this.intervals = [];

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
    this.fogCanvas = new Canvas(mapSize.width, mapSize.height);
    this.fogCanvas = new fog.fogCanvas(this.fogCanvas, mapSize.width, mapSize.height,
                                       playerSight);
    if (!_.isUndefined(gameInfo.fog)){
      var saveImage = new Canvas.Image();
      var fogArray = gameInfo.fog.split(",");
      saveImage.src = new Buffer(fogArray[fogArray.length - 1], "base64");
      this.fogCanvas.loadFromSave(saveImage);
      saveImage.onload = function(){
        console.log("loaded image", saveImage);
        this.fogCanvas.loadFromSave(saveImage);
      };
    }
    
    //setup the map
    var organizedMap = [];
    for (i = 0; i < gameInfo.map.length; i++){
      var piece = gameInfo.map[i].toObject();
      piece.x = piece.x * 2;
      piece.y = piece.y * 2;
      organizedMap.push(piece);
    }
    this.canvas.setMap(dragons.utils.buildMap(organizedMap)); // organize the map object for easier access

    this.intervals.push(setInterval(this.physicsUpdate.bind(this), physicsUpdateTime));
    this.intervals.push(setInterval(this.gameUpdate.bind(this), gameUpdateTime));
    this.intervals.push(setInterval(this.updateTimers.bind(this), 4));
    this.intervals.push(setInterval(this.saveGame.bind(this), saveGameTime));
    console.log("set up", this.intervals);

    // setup the players
    for (i = 0; i < this.gameInfo.players.length; i++){
      var currPlayer = this.gameInfo.players[i];
      var player = new dragons.gameElements.Player(null, 50, 50, currPlayer.x, currPlayer.y, currPlayer.name, currPlayer._id);
      this.canvas.addElement(player);
      this.players[currPlayer._id] = this.canvas.elements[this.canvas.elements.length - 1];
      this.players[currPlayer._id].attacks = currPlayer.attacks;
    }
  };

  _ptype = Game.prototype;

  _ptype.removeClient = function(client){
    for (var i = 0; i < this.clients.length; i++){
      if (this.clients[i].user._id === client.user._id){
        console.log("removing client");
        this.clients.splice(i, 1);
        break;
      }
    }
  };

  _ptype.physicsUpdate = function(){
    this.canvas.update();

    for (var player in this.players){
      if (this.players.hasOwnProperty(player)){
        this.fogCanvas.updateFog(this.players[player]);
      }
    }
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
    this.sockets["in"](this.room).emit("update", gameState);
  };

  _ptype.updateTimers = function(){
    this._dt         = new Date().getTime() - this._dte;
    this._dte        = new Date().getTime();
    this.localTime += this._dt/1000.0;
  };

  _ptype.addClient = function(client){
    // make sure they're not already connected
    for (var i = 0; i < this.clients.length; i++){
      if (this.clients[i].user._id === client.user._id){
        return false;
      }
    }
    this.clients.push(client);
    client.join(this.room);
    console.log("connected to", this.room);


    if(this.clients.length >=  2){
      // we're ready to go
      this.start();
    }
    return true;
  };

  _ptype.start = function(){
    console.log("starting game");
    var seqNums = {};
    // reset player move seq numbers
    for (var player in this.players){
      if (this.players.hasOwnProperty(player)){
        seqNums[this.players[player]._id] = this.players[player].lastHandledInput;
      }
    }
    this.sockets["in"](this.room).emit("start", {time: this.localTime, inputNums: seqNums});
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

  _ptype.handleEquip = function(data, client){
    if (client.player_id === null){ return }

    var player = this.players[client.player_id];
    if (_.has(data, "attack1")){
      player.attacks[0] = data.attack1;
    }

    if (_.has(data, "attack2")){
      player.attacks[1] = data.attack2;
    }
  };

  // saves game state in db
  _ptype.saveGame = function(cb){
    // update positions
    for (var i = 0; i < this.gameInfo.players.length; i++){
      var player = this.gameInfo.players[i];
      if (_.has(this.players, player._id)){
        player.x = this.players[player._id].x;
        player.y = this.players[player._id].y;
        player.attacks = this.players[player._id].attacks;
        // TODO save level
      }
    }
    this.gameInfo.fog = this.fogCanvas.outputPng();
    this.gameInfo.markModified("players");

    this.gameInfo.save(cb);
  };

  // cleans up a game before deletion
  _ptype.destroy = function(cb){
    for (var i = 0; i < this.intervals.length; i++){
      clearInterval(this.intervals[i]);
    }
    this.intervals.splice(0);
    this.saveGame(cb);
  };

  module.exports = Game;
}());
