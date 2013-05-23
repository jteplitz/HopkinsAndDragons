/*globals dragons*/
(function(){
  "use strict";

  var _ = require("underscore"),
      Canvas = require("canvas"),
      conf = require('nconf').argv().env().file({file: __dirname + '/../config.json'}),

      Game, _ptype, organizeMovements, mergeCombats, cleanCombatData, addClientToCombat,

      // physics stuff
      physicsUpdateTime = conf.get("gameGlobals:physicsUpdateTime"),
      gameUpdateTime    = conf.get("gameGlobals:serverSyncTime"),
      playerSight       = parseInt(conf.get("gameGlobals:playerSight"), 10),
      saveGameTime      = conf.get("gameGlobals:saveGameTime");

      // load the game classes
      var dragons = require("../public/javascripts/canvas.js"),
          Combat  = require("../public/javascripts/combat.js"),
          fog     = require("../public/javascripts/fog.js");
  
  Game = function(id, dbGame, gameInfo, sockets){
    console.log("starting game");
    this.gameId    = id;
    this.randomId  = Math.random() * 100;
    this.dbGame    = dbGame;
    this.gameInfo  = gameInfo;
    this.sockets   = sockets;
    this.players   = {};
    this.enemies   = [];
    this.combats   = [];
    this.room      = "/game/" + id;
    this.clients   = [];
    this.intervals = [];
    this.combatIndex = -1;

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

    this.canvas    = new dragons.canvas({width: mapSize.width, height: mapSize.height}, conf);
    this.fogCanvas = new Canvas(mapSize.width, mapSize.height);
    this.fogCanvas = new fog.fogCanvas(this.fogCanvas, mapSize.width, mapSize.height,
                                       playerSight);
    console.log(gameInfo.fog, _.isUndefined(gameInfo.fog));
    if (!_.isUndefined(gameInfo.fog) && gameInfo.fog !== ""){
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
      var piece = gameInfo.map[i];
      piece.x = piece.x * 2;
      piece.y = piece.y * 2;
      organizedMap.push(piece);
    }
    this.canvas.setMap(dragons.utils.buildMap(organizedMap)); // organize the map object for easier access

    this.intervals.push(setInterval(this.updateTimers.bind(this), 4));

    // setup the players
    for (i = 0; i < this.gameInfo.players.length; i++){
      var currPlayer = this.gameInfo.players[i];
      var player = new dragons.gameElements.Player(null, 50, 50, currPlayer.x, currPlayer.y, currPlayer.name, currPlayer._id);
      player.health = currPlayer.health;
      this.canvas.addElement(player);
      this.players[currPlayer._id] = this.canvas.elements[this.canvas.elements.length - 1];
      this.players[currPlayer._id].attacks = currPlayer.attacks;
    }

    // setup the enemies
    for (i = 0; i < this.gameInfo.enemies.length; i++){
      var currEnemy = this.gameInfo.enemies[i];
      //console.log("enemy data", currEnemy);
      var enemy = new dragons.gameElements.Enemy(null, 50, 50, currEnemy.x * 2, currEnemy.y * 2, currEnemy.pullRadius, currEnemy._id);
      enemy.health = currEnemy.health;
      enemy.gameData = currEnemy;
      this.enemies.push(enemy);
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
    this.checkForCombat();
    this.checkForRevive();
  };

  _ptype.checkForRevive = function(){
    for (var player in this.players){
      if (this.players.hasOwnProperty(player) && this.players[player].health <= 0){
        // here's a dead guy. See if he can be revived
        for (var checkId in this.players){
          if (this.players.hasOwnProperty(checkId) && checkId !== player){
            var checkPlayer = this.players[checkId];
            var yourGuy     = this.players[player];
            if (checkPlayer.x + checkPlayer.width > yourGuy.x &&
                checkPlayer.x < yourGuy.x + yourGuy.width     &&
                checkPlayer.y + checkPlayer.height > yourGuy.y &&
                checkPlayer.y < yourGuy.y + yourGuy.height){
              yourGuy.health = 50; // revive him
            }
          }
        }
      }
    }
  };

  _ptype.checkForCombat = function(){
    var combats = [], i, j, player, combatRunning = false;
    checkPlayer: for (player in this.players){
      if (this.players.hasOwnProperty(player) && !this.players[player].inCombat){
        var combatIndex = null;
        checkEnemy: for (i = 0; i < this.enemies.length; i++){
          var thisEnemy = this.enemies[i], thisPlayer = this.players[player];
          if ((thisEnemy.x + (thisEnemy.width / 2)) - thisEnemy.pullRadius * 2 < thisPlayer.x + thisPlayer.width &&
              (thisEnemy.x + (thisEnemy.width / 2)) + thisEnemy.pullRadius * 2 > thisPlayer.x &&
              (thisEnemy.y + (thisEnemy.height / 2)) - thisEnemy.pullRadius * 2 < thisPlayer.y + thisPlayer.height &&
              (thisEnemy.y + (thisEnemy.height / 2)) + thisEnemy.pullRadius * 2 > thisPlayer.y){
            this.players[player].inCombat = true;
            // we're in this enemies pull radius
            if (combatIndex === null){
              // first enemyEncountered
              for (j = 0; j < combats.length; j++){
                if (_.has(combats[j].enemies, this.enemies[i]._id)){
                  // this enemy is already in combat so just add this player to it
                  console.log("enemy is already in combat");
                  combats[j].players[this.players[player]._id] = this.players[player];
                  console.log("added players", combats[j].players);
                  combatIndex = j;
                  combatRunning = false;
                  continue checkEnemy;
                }
              }
              // check if this enemy is in a running combat session
              for (j = 0; j < this.combats.length; j++){
                if (_.has(this.combats[j].enemies, this.enemies[i]._id)){
                  this.combats[j].addPlayer(this.players[player]);
                  addClientToCombat(this.players[player], this.clients, this.combats[j], this.sockets);
                  combatIndex = j;
                  combatRunning = true;
                  continue checkEnemy;
                }
              }
              // this enemy is not in combat with anybody so create a new combat
              var combatInfo = {players: {}, enemies: {}};
              combatInfo.players[this.players[player]._id] = this.players[player];
              combatInfo.enemies[this.enemies[i]._id]      = this.enemies[i];
              combats.push(combatInfo);
              combatIndex = combats.length - 1;
            } else {
              if (!combatRunning){
                // we're already in combat so add this enemy to the combat
                // make sure that this enemy isn't in combat somewhere else
                for (j = 0; j < combats.length; j++){
                  if (j !== combatIndex && _.has(combats[j].enemies, this.enemies[i]._id)){
                    // merge the combats
                    combats = mergeCombats(combats, combatIndex, j);
                    combatIndex = combats.length - 1;
                    break;
                  }
                }
                combats[combatIndex].enemies[this.enemies[i]._id] = this.enemies[i];
              } else {
                // this is already an active combat session that we've joined. Add the enemy
                console.log("adding extra enemy to combat session");

                // check to make sure that the enemy isn't alrady in a different combat session
                for (j = 0; j < this.combats.length; j++){
                  if (_.has(this.combats[j], this.enemies[i]._id)){
                    this.combats = mergeCombats(this.combats, combatIndex, j);
                    combatIndex = this.combats.length - 1;
                    break;
                  }
                }
                this.combats[combatIndex].enemies[this.enemies[i]._id] = this.enemies[i];
                addClientToCombat(this.players[player], this.clients, this.combats[combatIndex], this.sockets);
              }
            }
          }
        } // check enemy
      }
    } // check player
    for (i = 0; i < combats.length; i++){
      this.combats.push(new Combat(combats[i].enemies, combats[i].players, null, conf));
      this.combatIndex++;
      // add this client to the combat room
      var added = false;
      for (player in combats[i].players){
        if (combats[i].players.hasOwnProperty(player)){
          for (var w = 0; w < this.clients.length; w++){
            if (String(this.clients[w].player_id) === player){
              console.log("adding client to room");
              added = true;
              this.clients[w].join(this.room + "/c/" + this.combatIndex);
              break;
            }
          }
          if (!added){
            console.log("fuck", player, this.clients);
          }
        }
      }
      var thisCombat = this.combats[this.combats.length - 1];
      thisCombat.start();
      thisCombat.roomId = this.room + "/c/" + this.combatIndex;

      this.sockets["in"](thisCombat.roomId).emit("combatStart", cleanCombatData(thisCombat));
    }
  };

  cleanCombatData = function(combat){
    // clean up the players and enemies
    var players = {}, enemies = {};
    for (var player in combat.players){
      if (combat.players.hasOwnProperty(player)){
        players[player] = {health: combat.players[player].health};
      }
    }
    for (var enemy in combat.enemies){
      if (combat.enemies.hasOwnProperty(enemy)){
        console.log("adding", enemy);
        enemies[enemy] = {health: combat.enemies[enemy].health};
      }
    }
    return {players: players, enemies: enemies};
  };

  addClientToCombat = function(player, clients, combat, socket){
    var socketCombat = cleanCombatData(combat);
    for (var i = 0; i < clients.length; i++){
      if (String(clients[i].player_id) === String(player._id)){
        socket["in"](combat.roomId).emit("combatJoin", {player: player._id, combat: socketCombat});
        clients[i].join(combat.roomId);
        clients[i].emit("combatStart", socketCombat); // start their combat
      }
    }
  };

  // merges the players and enemies of two combats, removes those combats from the array, and places the merged entry at the end
  mergeCombats = function(combats, sourceNum, destNum){
    console.log("merging combats");
    var source = combats[source];
    var dest   = combats[dest];
    for (var i = 0; i < source.players.length; i++){
      if (_.has(dest.players, source.players[i]._id)){
        dest.players[source.players[i]._id] = source.players[i];
      }
    }
    for (i = 0; i < source.enemies.length; i++){
      if (_.has(dest.enemies, source.enemies[i]._id)){
        dest.enemies[source.enemies[i]._id] = source.enemies[i];
      }
    }
    combats.splice(sourceNum, 1);
    combats.splice((destNum > sourceNum) ? destNum - 1 : destNum, 1);
    combats.push(dest);
  };

  _ptype.handleAttack = function(data, client){
    var self = this;
    var player = this.players[client.player_id];
    // find the correct combat
    var combat = null;
    for (var i = 0; i < this.combats.length; i++){
      if (_.has(this.combats[i].players, client.player_id)){
        combat = this.combats[i];
        break;
      }
    }
    var messages = combat.attack(client.player_id, data.num, data.target);
    if (messages === null){
      console.log("no fight yet");
    } else {
      console.log("fight", messages);
      // fight has been fought
      // send data to all clients in the fight

      // only send over player and enemy health right now
      var enemiesDead = true, playersDead = true;
      var playerInfo = {}, enemyInfo = {};
      for (player in combat.players){
        if (combat.players.hasOwnProperty(player)){
          playerInfo[player] = {health: combat.players[player].health};
          if (combat.players[player].health >= 0){
            playersDead = false;
          }
        }
      }

      for (var enemy in combat.enemies){
        if (combat.enemies.hasOwnProperty(enemy)){
          enemyInfo[enemy] = {health: combat.enemies[enemy].health};
          if (combat.enemies[enemy].health >= 0){
            enemiesDead = false;
          }
        }
      }

      // check if all the players and / or enemies are dead

      this.sockets["in"](combat.roomId).emit("fight", {messages: messages, players: playerInfo,
                                                      enemies: enemyInfo});

      if (enemiesDead || playersDead){
        this.sockets["in"](combat.roomId).emit("combatOver", cleanCombatData(combat));
        this.combats[i].end();
        delete this.combats[i];
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
    
    // check if they're in combat

    // figure out what player this is
    for (var player in this.players){
      if (this.players.hasOwnProperty(player)){
        if (this.players[player].owner === client.user._id){
          break;
        }
      }
    }
    var combat = null;
    for (i = 0; i < this.combats.length; i++){
      if (_.has(this.combats[i].players, player)){
        console.log("player connected is in combat");
        // they're in combat
        combat = this.combats[i];
        break;
      }
    }

    if(this.clients.length >=  2){
      // we're ready to go
      this.start();
      if (combat !== null){
        // send the combat start message
        client.emit("combatStart", cleanCombatData(combat));
        // add them to the room
        client.join(combat.roomId);
      }
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

    // start the various game loops
    this.intervals.push(setInterval(this.physicsUpdate.bind(this), physicsUpdateTime));
    this.intervals.push(setInterval(this.gameUpdate.bind(this), gameUpdateTime));
    this.intervals.push(setInterval(this.saveGame.bind(this), saveGameTime));
    
    this.sockets["in"](this.room).emit("start", {time: this.localTime, inputNums: seqNums});
  };

  _ptype.handleInput = function(data, client){
    if (client.player_id === null){ return; } // owners can't play
    var player = this.players[client.player_id];
    if (player.health <= 0){
      // dead people can't move
      return;
    }
    player.inputs.push({
      inputs: data.inputs,
      seq: data.seq,
      time: data.time
    });
  };

  _ptype.handleEquip = function(data, client){
    if (client.player_id === null){ return }

    var player = this.players[client.player_id];
    if (_.isUndefined(player.attacks)){
      player.attacks = [];
    }
    if (_.has(data, "attack1")){
      player.attacks[0] = data.attack1;
    }

    if (_.has(data, "attack2")){
      player.attacks[1] = data.attack2;
    }
  };

  // saves game state in db
  _ptype.saveGame = function(cb){
    var i = 0;
    // update positions
    for (i = 0; i < this.dbGame.players.length; i++){
      var player = this.dbGame.players[i];
      if (_.has(this.players, player._id)){
        player.x = this.players[player._id].x;
        player.y = this.players[player._id].y;
        player.attacks = this.players[player._id].attacks;
        player.health  = this.players[player._id].health;
        // TODO save level
      }
    }

    var dbEnemies = [];
    for (i = 0; i < this.enemies.length; i++){
      var thisEnemy = this.enemies[i];
      if (thisEnemy.health <= 0){
        // don't save dead enemies
        continue;
      }
      dbEnemies.push({
        baseEnemy: thisEnemy.gameData.baseEnemy._id,
        x: thisEnemy.x / 2,
        y: thisEnemy.y / 2,
        pullRadius: thisEnemy.pullRadius,
        health: thisEnemy.health,
        _id: thisEnemy._id
      });
      console.log("saving", dbEnemies[dbEnemies.length - 1]);
    }
    this.dbGame.enemies = dbEnemies;

    this.dbGame.fog = this.fogCanvas.outputPng();
    this.dbGame.markModified("players");
    this.dbGame.markModified("enemies");

    this.dbGame.save(cb);
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
