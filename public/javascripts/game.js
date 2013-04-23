/*globals dragons _ io THREEx*/
(function(){
  "use strict";

  // functions
  var restoreMap, addPiece, addEnemy, main, sync, handleKeyDown, handleKeyUp, startGame,
      updatePhysics, handleInput, createMovementVector, ping, handlePing,
      lerp, vLerp;

  // globals
  var canvas, mapPieces = [], socket, guy, keyboard, observer = false,
      // network globals
      netLatency = 0.001, netPing = 0.001, lastPingTime;

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
      console.log("The game is starting");
    });

    socket.on("ping", handlePing);

    var guyImage = new Image();
    guyImage.onload = function(){
      guy = new dragons.gameElements.Player(guyImage, 50, 50, 20, 20, 0, "", null);
      
      canvas.elements.push(guy);
      startGame();
    };
    guyImage.src = "http://bbsimg.ngfiles.com/1/23542000/ngbbs4ee01350764a2.jpg";

  });

  startGame = function(){
    setInterval(updatePhysics, dragons.globals.physicsUpdateTime);
    main();
  };

  updatePhysics = function(){
    canvas.update();
  };

  // stores inputs as they come in. Will also send them to the server immediatly
  handleInput = function(){
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
      guy.lastRecievedInput++;

      guy.inputs.push({
        inputs: inputs,
        seq: guy.lastRecievedInput
      }); // TODO attach frame time

      // TODO send to server
    }
  };

  main = function(){
    handleInput();
    canvas.draw();
    //sync();
    window.requestAnimationFrame( main.bind(this), $("#map")[0]);
  };

  // sends positions through the socket
  sync = function(){
    if (!observer){
      socket.emit("position", {dx: guy.dx, dy: guy.dy, x: guy.x, y: guy.y});
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
  };

 //Simple linear interpolation
 lerp = function(p, n, t) { var _t = Number(t); _t = (Math.max(0, Math.min(1, _t))).fixed(); return (p + _t * (n - p)).fixed(); };
 //Simple linear interpolation between 2 vectors
 vLerp = function(v,tv,t) { return { x: this.lerp(v.x, tv.x, t), y:this.lerp(v.y, tv.y, t) }; };
}());
