/*globals dragons _ io THREEx*/
(function(){
  "use strict";

  // functions
  var restoreMap, addPiece, addEnemy, main, sync, handleKeyDown, handleKeyUp, observer = false,
      updatePhysics, handleInput, processInput, createMovementVector;

  // globals
  var canvas, mapPieces = [], socket, guy, keyboard;

  dragons.organizedMap = {};

  $(document).ready(function(){
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

    var guyImage = new Image();
    guyImage.onload = function(){
      guy = new dragons.gameElements.image(guyImage, 50, 50, 20, 20, 0, null);
      
      // TODO create a player element class to handle this
      guy.inputs = [];
      guy.lastRecievedInput = 0;
      guy.lastHandledInput  = 0;

      canvas.elements.push(guy);
      setInterval(updatePhysics, dragons.globals.physicsUpdateTime);
      main();
    };
    guyImage.src = "http://bbsimg.ngfiles.com/1/23542000/ngbbs4ee01350764a2.jpg";

  });

  updatePhysics = function(){
    // TODO this should all be handled in the player update method
    var guyMovement = processInput();
    guy.x = guy.x + guyMovement.x;
    guy.y = guy.y + guyMovement.y;
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

  processInput = function(){
    var dx = 0, dy = 0;
    
    for (var i = 0; i < guy.inputs.length; i++){
      if (guy.inputs[i].seq <= guy.lastHandledInput){
        continue; // we've already moved him this much. TODO: remove inputs after server handling
      }
      
      var input = guy.inputs[i].inputs;

      // loop through each input in the sequence
      for (var j = 0; j < input.length; j++){
        switch (input[j]){
          case "l":
            dx -= 1;
            break;
          case "r":
            dx += 1;
            break;
          case "u":
            dy -= 1;
            break;
          case "d":
            dy += 1;
            break;
        }
      }
    }

    // now apply the movement
    if (guy.inputs.length > 0){
      // update the lastHandledInput
      guy.lastHandledInput = guy.inputs[guy.inputs.length - 1].seq;
    }
    return createMovementVector(dx, dy);
  };

  createMovementVector = function(dx, dy){
    //Must be fixed step, at physics sync speed.
    return {
        x : (dx * (dragons.globals.playerSpeed * 0.015)),
        y : (dy * (dragons.globals.playerSpeed * 0.015))
    };
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
}());
