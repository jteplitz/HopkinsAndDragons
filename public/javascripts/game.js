/*globals dragons _ io THREEx*/
(function(){
  "use strict";

  // functions
  var restoreMap, addPiece, addEnemy, main, sync, handleKeyDown, handleKeyUp, startGame,
      setupPlayers, setupPlayer, scrollMap, handleFog,
      updatePhysics, handleInput, createMovementVector, ping, handlePing,
      handleServerUpdate, updateTimers, processServerUpdates, handleServerError,
      startDraggingAttack, dragAttack, stopDraggingAttack,
      checkForCombat,
      updateFrameRate,
      lerp, vLerp;

  // globals
  var canvas, fogCanvas, canvasContainer = {}, mapInfo = {}, mapPieces = [], socket, players = {}, yourGuy = null, keyboard, observer = false, enemies = [],
      playersLoading = 0, active = false,
      draggingAttack = false,
      // physics globals
      pdt = 0.001, pdte = new Date().getTime(),
      // network globals
      netLatency = 0.001, netPing = 0.001, lastPingTime, serverTime = 0, clientTime = 0, localTime, dt, dte,
      lastLocalTime = 0,
      serverUpdates = [], lastInputNum = null,
      updateTimes  = [];

  dragons.organizedMap = {};

  $(document).ready(function(){
    setInterval(ping, 1000); // begin tracking ping immediatly

    canvas = new dragons.canvas($("#map")[0]);
    mapInfo = {
      width: $("#map").width(),
      height: $("#map").height()
    };
    fogCanvas = $("<canvas id='fogCanvas' width='" + mapInfo.width + "' height='" + mapInfo.height + "'></canvas>");
    $("#canvasContainer").append(fogCanvas);
    fogCanvas = new dragons.fogCanvas(fogCanvas[0], mapInfo.width, mapInfo.height, dragons.globals.playerSight);
    if (!_.isUndefined(dragons.fog) && !_.isNull(dragons.fog)){
      var saveImage = new Image();
      saveImage.src = dragons.fog;
      saveImage.onload = function(){
        fogCanvas.loadFromSave(saveImage);
      };
    }

    canvasContainer = {
      width: $("#canvasContainer").width(),
      height: $("#canvasContainer").height(),
      scrollLeft: $("#canvasContainer").scrollLeft(),
      scrollTop: $("#canvasContainer").scrollTop()
    };
    restoreMap();
    keyboard = new THREEx.KeyboardState();

    $(document).on("mousemove", dragAttack);
    $("#attacks .attack").on("mousedown", startDraggingAttack);
    $("#attacks .attack").on("dragstart", function(e){ e.preventDefault() }); // prevent browser dragging from getting in the way
    $(document).on("mouseup", ".dragging", stopDraggingAttack);

    socket = io.connect(window.location.protocol + "//" + window.location.host);

    socket.on("connect", function(){
      // attempt to join the game
      socket.emit("join", {gameId: dragons.gameId});
    });

    socket.on("connected", function(data){
      console.log("connected to game " +  data.gameId + " with " + (data.clientCount - 1) + " others"); });

    socket.on("start", function(data){
      localTime = data.time + netLatency;
      var inputNum = data.inputNums[dragons.your_id];
      if (!_.isNull(yourGuy)){
        yourGuy.lastRecievedInput = inputNum;
        yourGuy.lastHandledInput  = inputNum;
      } else {
        lastInputNum = inputNum;
      }

      active = true;
    });

    socket.on("ping", handlePing);
    socket.on("update", handleServerUpdate);
    socket.on("error", handleServerError);

    setInterval(updateTimers, 4);
    setupPlayers();
  });

  startDraggingAttack = function(e){
    if (!draggingAttack){
      draggingAttack = true;

      var piece = $(this).clone();
      piece.addClass("dragging");
      piece.attr("data-startX", $(this).offset().left);
      piece.attr("data-startY", $(this).offset().top);
      $("body").append(piece);

      dragAttack(e);
    }
  };

  dragAttack = function(e){
    if (draggingAttack){
      $(".dragging").css("top", e.pageY + "px");
      $(".dragging").css("left", e.pageX + "px");
    }
  };

  stopDraggingAttack = function(e){
    if (draggingAttack){
      var dragging = $(".dragging");
      if (dragons.utils.detectMouseOver($(".attack1"), e)){
        yourGuy.attacks[0] = dragging.attr("data-name");
        $(".attack1").html("<img src='" + dragging.attr("src") + "' width='40px' height='40px' />");
        dragging.remove();
        socket.emit("equip", {attack1: dragging.attr("data-name")});
      } else if (dragons.utils.detectMouseOver($(".attack2"), e)){
        yourGuy.attacks[1] = dragging.attr("data-name");
        $(".attack2").html("<img src='" + dragging.attr("src") + "' width='40px' height='40px' />");
        dragging.remove();
        socket.emit("equip", {attack2: dragging.attr("data-name")});
      } else {
        dragging.animate({
          left: dragging.attr("data-startX") + "px",
          top: dragging.attr("data-startY") + "px"
        }, {
          duration: 200,
          complete: function(){
            $(this).remove();
          }
        });
      }
      draggingAttack = false;
    }
  };

  checkForCombat = function(){
    var combatEnemies = [];
    for (var i = 0; i < enemies.length; i++){
      if (enemies[i].x - enemies[i].pullRadius < yourGuy.x &&
          enemies[i].x + enemies[i].pullRadius > yourGuy.x &&
          enemies[i].y - enemies[i].pullRadius < yourGuy.y &&
          enemies[i].y + enemies[i].pullRadius > yourGuy.y){
        combatEnemies.push(enemies[i]);
      }
    }

    if (combatEnemies.length > 0){
      var combat = new dragons.combat();
      active = false;
      combat.start(combatEnemies);
    }
  };

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
    checkForCombat();
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
    if (serverUpdates.length === 0){
      return;
    }
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
      target   = serverUpdates[serverUpdates.length - 1];
      previous = serverUpdates[serverUpdates.length - 1];
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
       time_point = time_point.fixed(3);

       var latestServerUpdate = serverUpdates[serverUpdates.length - 1];

       for (var player in target.pos){
         if (target.pos.hasOwnProperty(player)){
           if (players[player]._id === dragons.your_id){
             // TODO smoothly correct our own position
             continue; // For now we don't change ourselves
           }
          
           var currentPosition = {x: players[player].x, y: players[player].y};
           var newPosition     = vLerp(currentPosition, target.pos[player], pdt * dragons.globals.clientSmooth);
           if (players[player].x !== newPosition.x || players[player].y !== newPosition.y){
             players[player].movements.push({x: newPosition.x, y: newPosition.y});
           }
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
      player.attacks = playerInfo.attacks;
      playersLoading--;
      canvas.addElement(player);
      players[playerInfo._id] = canvas.elements[canvas.elements.length - 1];

      if (player._id === dragons.your_id){
        yourGuy = player;
        $("#playerBar .name").text(player.name);
        for (var i = 0; i < ((player.attacks.length < 2) ? player.attacks.length : 2); i++){
          $(".attack" + (i + 1)).html("<img src='" + dragons.attacks[player.attacks[i]].icon + "' width='40px' height='40px' + />");
        }
      }
      if (!_.isNull(lastInputNum)){
        yourGuy.lastRecievedInput = lastInputNum;
        yourGuy.lastHandledInput  = lastInputNum;
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
    updateTimes.push(localTime - lastLocalTime);
    lastLocalTime = localTime;
    if (updateTimes.length === 10){
      updateFrameRate();
      updateTimes.splice(0);
    }
    handleInput();
    processServerUpdates();
    handleFog();
    var oldX = yourGuy.x, oldY = yourGuy.y;
    canvas.draw();
    scrollMap(yourGuy.movements);

    /*if (yourGuy.movements.length > 0){
      var x = "", y = "";
      if (yourGuy.x > oldX){
        x = "left";
      } else if (yourGuy.x < oldX){
        x = "right";
      }

      if (yourGuy.y > oldY){
        y = "
      }
    }*/

    //sync();
    window.requestAnimationFrame( main.bind(this), $("#map")[0]);
  };

  handleFog = function(){
    for (var player in players){
      if (players.hasOwnProperty(player)){
        fogCanvas.updateFog(players[player]);
      }
    }
  };

  scrollMap = function(direction){
    if (yourGuy.x + yourGuy.width >= canvasContainer.width + canvasContainer.scrollLeft){
      canvasContainer.scrollLeft += 200;
      $("#canvasContainer").animate({scrollLeft: canvasContainer.scrollLeft}, 200);
    } else if (yourGuy.x <= canvasContainer.scrollLeft){
      if (canvasContainer.scrollLeft - 200 < 0){
        canvasContainer.scrollLeft = 0;
      } else {
        canvasContainer.scrollLeft -= 200;
      }
      $("#canvasContainer").animate({scrollLeft: canvasContainer.scrollLeft}, 200);
    }

    if (yourGuy.y + yourGuy.height >= canvasContainer.height + canvasContainer.scrollTop){
      canvasContainer.scrollTop += 200;
      $("#canvasContainer").animate({scrollTop: canvasContainer.scrollTop}, 200);
    } else if (yourGuy.y < canvasContainer.scrollTop){
      if (canvasContainer.scrollTop - 200 < 0){
        canvasContainer.scrollTop = 0;
      } else {
        canvasContainer.scrollTop -= 200;
      }
      $("#canvasContainer").animate({scrollTop: canvasContainer.scrollTop}, 200);
    }
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
      canvas.setMap(dragons.organizedMap);
      return piece;
    };
  };

  // adds an enemy to the canvas
  addEnemy = function(image, enemyData, id){
    return function(){
      var enemy = new dragons.gameElements.Enemy(image, 50, 50, enemyData.x * 2, enemyData.y * 2, enemyData.pullRadius, enemyData._id);
      enemy.gameData = enemyData;
      canvas.addElement(enemy);
      enemies.push(enemy);
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

  updateFrameRate = function(){
    var sum = 0;
    for (var i = 0; i < updateTimes.length; i++){
      sum += updateTimes[i];
    }
    sum /= i;
    $("#frameRate").text((1 / sum) + " FPS");
  };

  // for now just alert the error
  handleServerError = function(err){
    console.log("error", err);
    alert(err.msg);
  };

  //Simple linear interpolation
  lerp = function(p, n, t) { var _t = Number(t); _t = (Math.max(0, Math.min(1, _t))).fixed(); return (p + _t * (n - p)).fixed(); };
  //Simple linear interpolation between 2 vectors
  vLerp = function(v,tv,t) { return { x: lerp(v.x, tv.x, t), y: lerp(v.y, tv.y, t) }; };
  Number.prototype.fixed = function(n) { n = n || 3; return parseFloat(this.toFixed(n)); }; // I don't love doing this...
}());
