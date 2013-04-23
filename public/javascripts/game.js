/*globals dragons _ io THREEx*/ (function(){
  "use strict";

  // functions
  var restoreMap, addPiece, addEnemy, main, sync, handleKeyDown, handleKeyUp, startGame,
      setupPlayers, setupPlayer,
      updatePhysics, handleInput, createMovementVector, ping, handlePing,
      handleServerUpdate, updateTimers, processServerUpdates,
      lerp, vLerp;

  // globals
  var canvas, mapPieces = [], socket, players = {}, yourGuy, keyboard, observer = false,
      playersLoading = 0, active = false,
      // physics globals
      pdt = 0.001, pdte = new Date().getTime(),
      // network globals
      netLatency = 0.001, netPing = 0.001, lastPingTime, serverTime = 0, clientTime = 0, localTime, dt, dte,
      serverUpdates = [];

  dragons.organizedMap = {};

  $(document).ready(function(){
    setInterval(ping, 1000); // begin tracking ping immediatly

    canvas = new dragons.canvas($("#map")[0]);
    restoreMap();
    keyboard = new THREEx.KeyboardState();

    $("#observe").click(function(){ observer = !observer});

    socket = io.connect(window.location.url);

    socket.on("connect", function(){
      // attempt to join the game
      socket.emit("join", {gameId: dragons.gameId});
    });

    socket.on("connected", function(data){
      console.log("connected to game " +  data.gameId + " with " + (data.clientCount - 1) + " others"); });

    socket.on("start", function(data){
      localTime = data.time + netLatency;
      active = true;
    });

    socket.on("ping", handlePing);
    socket.on("update", handleServerUpdate);

    setInterval(updateTimers, 4);
    setupPlayers();
  });

  startGame = function(){
    setInterval(updatePhysics, dragons.globals.physicsUpdateTime);
    main();
  };

  updateTimers = function(){
    dt         = new Date().getTime() - dte;
    dte        = new Date().getTime();
    localTime += dt/1000.0;
  };

  updatePhysics = function(){
    // update delta time
    pdt = (new Date().getTime() - pdte)/1000.0;
    pdte = new Date().getTime();
    canvas.update();
  };

  handleServerUpdate = function(state){
    this.serverTime = state.time;
    this.clientTime = this.serverTime - (dragons.globals.netOffset / 1000);
    
    serverUpdates.push(state);
    
    // remove server updates that are too old TODO: this niumber isn't quite right
    if (serverUpdates.length >= (60 * dragons.globals.bufferSize)){
      serverUpdates.splice(0, 1);
    }

    // TODO correct client prediction
  };

  processServerUpdates = function(){
    var i;
    // find the oldest update unprocessed update
    var count = serverUpdates.length - 1;

    var target   = null;
    var previous = null;

    for (i = 0; i < count; i++){
      var point      = serverUpdates[i];
      var next_point = serverUpdates[i+1];

      //Compare our point in time with the server times we have
      if(localTime > point.time && localTime < next_point.time) {
          target   = next_point;
          previous = point;
          break;
      }
    }
    
    if (_.isNull(target)){
      // with no target we move to the last known positon
      target   = serverUpdates[0];
      previous = serverUpdates[0];
    }

    if (target && previous){ // proabably redundent
       var targetTime     = target.time;

       var difference     = targetTime - localTime;
       var max_difference = (targetTime - previous.time);
       var time_point     = (difference/max_difference);

       // I guess target and previous can be equal if you have a super aweseome ping...
       if(_.isNaN(time_point) ){
         time_point = 0;
       }
       if(time_point === -Infinity){
         time_point = 0;
       }
       if(time_point === Infinity){
         time_point = 0;
       }

       var latestServerUpdate = serverUpdates[serverUpdates.length - 1];

       for (var player in target.pos){
         if (target.pos.hasOwnProperty(player)){
           if (players[player]._id === dragons.your_id){
             // TODO smoothly correct our own position
             continue; // For now we don't change ourselves
           }
          
           var currentPosition = {x: players[player].x, y: players[player].y};
           var newPosition     = vLerp(currentPosition, target.pos[player], pdt * dragons.globals.clientSmooth);
           console.log("lerping to", newPosition);
           players[player].x = newPosition.x;
           players[player].y = newPosition.y;
         }
       }
    }
  };

  setupPlayers = function(){
    for (var i = 0; i < dragons.players.length; i++){
      var playerImage = new Image();
      playerImage.onload = setupPlayer(playerImage, dragons.players[i]);
      playerImage.src = dragons.players[i].image;
      playersLoading++;
    }
  };

  setupPlayer = function(image, playerInfo){
    return function(){
      var player = new dragons.gameElements.Player(image, 50, 50, playerInfo.x, playerInfo.y, playerInfo.name, playerInfo._id);
      playersLoading--;
      canvas.addElement(player);
      players[playerInfo._id] = canvas.elements[canvas.elements.length - 1];

      if (player._id === dragons.your_id){
        yourGuy = player;
      }
      if (playersLoading === 0){
        startGame();
      }
    };
  };

  // stores inputs as they come in. Will also send them to the server immediatly
  handleInput = function(){
    if (!active){ return }

    var dx  = 0, dy = 0;
    var inputs = [];
    if (keyboard.pressed("left")){
      dx = -1;
      inputs.push("l");
    }
    if (keyboard.pressed("right")){
      dx = 1;
      inputs.push("r");
    }
    if (keyboard.pressed("up")){
      dy = -1;
      inputs.push("u");
    }
    if (keyboard.pressed("down")){
      dy = 1;
      inputs.push("d");
    }
    if (inputs.length > 0){
      yourGuy.inputs.push({
        inputs: inputs,
        seq: yourGuy.lastRecievedInput,
        time: localTime
      });

      socket.emit("input", {
        inputs: inputs,
        time: localTime,
        seq: yourGuy.lastRecievedInput
      });
      yourGuy.lastRecievedInput++;
    }
  };

  main = function(){
    handleInput();
    processServerUpdates();
    canvas.draw();
    //sync();
    window.requestAnimationFrame( main.bind(this), $("#map")[0]);
  };

  // sends positions through the socket
  sync = function(){
    if (!observer){
      //socket.emit("position", {dx: guy.dx, dy: guy.dy, x: guy.x, y: guy.y});
    }
  };

  // maybe place the following three functions in some other file? canvas.js? map.js...
  restoreMap = function(){
    var i;
    for (i = 0; i < dragons.map.length; i++){
      var pieceImage = new Image();
      pieceImage.onload = addPiece(pieceImage, dragons.map[i], dragons.map[i]._id);
      pieceImage.src = dragons.map[i].image;
    }

    for (i = 0; i < dragons.enemies.length; i++){
      var enemyImage    = new Image();
      enemyImage.onload = addEnemy(enemyImage, dragons.enemies[i], dragons.enemies[i]._id);
      enemyImage.src    = dragons.enemies[i].baseEnemy.image;
    }
  };
  // adds a loaded piece to the canvas
  addPiece = function(image, mapPiece, id){
    return function(){
      var piece = new dragons.RoomElement(image, dragons.globals.map.roomWidth * 2, dragons.globals.map.roomHeight * 2,
                                                 mapPiece.x * 2, mapPiece.y * 2, mapPiece.rotate, mapPiece.doorLeft, mapPiece.doorRight,
                                                 mapPiece.doorTop, mapPiece.doorBottom, id);
      canvas.addElement(piece);
      mapPieces.push(piece);
      dragons.utils.buildMap(mapPieces); // organize the map object for easier editing access
      return piece;
    };
  };

  // adds an enemy to the canvas
  addEnemy = function(image, enemyData, id){
    return function(){
      var enemy = new dragons.gameElements.Enemy(image, 50, 50, enemyData.x * 2, enemyData.y * 2, enemyData.pullRadius, enemyData._id);
      enemy.gameData = enemyData;
      canvas.addElement(enemy);
      return enemy;
    };
  };

  ping = function(){
    lastPingTime = new Date().getTime() - dragons.globals.fakeLag;
    socket.emit("ping", {time: lastPingTime});
  };

  handlePing = function(data){
    netPing    = new Date().getTime() - parseFloat(data.time, 10);
    netLatency = netPing / 2;
    $("#ping").text("Ping: " + netPing + " m.s.");
  };

 //Simple linear interpolation
 lerp = function(p, n, t) { var _t = Number(t); _t = (Math.max(0, Math.min(1, _t))).fixed(); return (p + _t * (n - p)).fixed(); };
 //Simple linear interpolation between 2 vectors
 vLerp = function(v,tv,t) { return { x: lerp(v.x, tv.x, t), y: lerp(v.y, tv.y, t) }; };
 Number.prototype.fixed = function(n) { n = n || 3; return parseFloat(this.toFixed(n)); }; // I don't love doing this...
}());
