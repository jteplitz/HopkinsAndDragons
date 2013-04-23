/*globals dragons _ io*/
(function(){
  "use strict";

  // functions
  var restoreMap, addPiece, addEnemy, main, sync, handleKeyDown, handleKeyUp, observer = false,
      updatePhysics;

  // globals
  var canvas, mapPieces = [], socket, guy;

  dragons.organizedMap = {};

  $(document).ready(function(){
    canvas = new dragons.canvas($("#map")[0]);
    restoreMap();

    $(document).on("keydown", handleKeyDown);
    $(document).on("keyup", handleKeyUp);
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
      canvas.elements.push(guy);
    };
    guyImage.src = "http://bbsimg.ngfiles.com/1/23542000/ngbbs4ee01350764a2.jpg";

    setInterval(updatePhysics, dragons.globals.physicsUpdateTime);
    main();
  });

  updatePhysics = function(){
    canvas.update();
  };

  handleKeyDown = function(e){
    if (observer){
      return;
    }

    switch(e.which){
      case 37:
        guy.dx = -5;
        e.preventDefault();
        break;
      case 38:
        guy.dy = -5;
        e.preventDefault();
        break;
      case 39:
        guy.dx = 5;
        e.preventDefault();
        break;
      case 40:
        guy.dy = 5;
        e.preventDefault();
        break;
    }
  };

  handleKeyUp = function(e){
    if (e.which === 37 || e.which === 39){
      e.preventDefault();
      guy.dx = 0;
    } else if (e.which === 38 || e.which === 40){
      e.preventDefault();
      guy.dy = 0;
    }
  };

  main = function(){
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
