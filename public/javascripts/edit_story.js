/*globals dragons _*/
(function(){
  "use strict";

  // functions
  var restoreMap, addPiece, addEnemy, main, handleMapClick, displayStoryDialog, closeStoryDialog, addStoryPoint,
      syncSuccess, syncError,
      VisibleStoryPoint;

  // globals
  var canvas, mapPieces = [], storyPieces, currentPoint = {};

  dragons.organizedMap = {};

  $(document).ready(function(){
    canvas = new dragons.canvas($("#map")[0]);

    $("#map").on("click", handleMapClick);
    $("#saveButton").on("click", addStoryPoint);
    $("#cancelButton").on("click", closeStoryDialog);

    restoreMap();
    setInterval(main, 50);
  });

  main = function(){
    canvas.update();
  };

  
  handleMapClick = function(e){
    // figure out what they clicked on
    for (var i = 0; i < canvas.elements.length; i++){
      var element = canvas.elements[i];
      if (element instanceof VisibleStoryPoint && dragons.utils.detectMouseOver(element, e, $("#map").offset())){
        // edit story point
        currentPoint = element.gameData;
        displayStoryDialog();
      }

    }

    // nothing was clicked on
    displayStoryDialog();
    currentPoint = {
      x: e.pageX - $("#map").offset().left,
      y: e.pageY - $("#map").offset().top,
      text: null
    };
  };

  displayStoryDialog = function(){
    $("#storyText").val(currentPoint.text);
    $("#storyPointModal").modal("show");
  };

  closeStoryDialog = function(){
    $("#storyText").val("");
    $("#storyPointModal").modal("hide");
  };

  addStoryPoint = function(){
    var visibleStoryData = {
      x: currentPoint.x,
      y: currentPoint.y,
      text: $("#storyText").val()
    };
    if (_.has(currentPoint, "_id")){
      visibleStoryData._id = currentPoint._id;
    }
    if (_.has(currentPoint, "enemy")){
      visibleStoryData.enemy = currentPoint.enemy;
    }
    var visibleStoryPoint = new VisibleStoryPoint(10, currentPoint.x, currentPoint.y,
                                                  (_.has(currentPoint, "_id")) ? currentPoint._id : null);
    visibleStoryPoint.gameData = visibleStoryData;
    canvas.addElement(visibleStoryPoint);
    closeStoryDialog();

    $.ajax({
      url: window.location.pathname,
      type: "PUT",
      dataType: "json",
      data: visibleStoryData,
      success: syncSuccess(visibleStoryPoint),
      failure: syncError(visibleStoryPoint)
    });
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
      var piece = new dragons.RoomElement(image, dragons.globals.map.roomWidth, dragons.globals.map.roomHeight,
                                                 mapPiece.x, mapPiece.y, mapPiece.rotate, mapPiece.doorLeft, mapPiece.doorRight,
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
      var enemy = new dragons.gameElements.Enemy(image, 25, 25, enemyData.x, enemyData.y, enemyData.pullRadius, enemyData._id);
      enemy.gameData = enemyData;
      canvas.addElement(enemy);
      return enemy;
    };
  };

  
  VisibleStoryPoint = function(radius, x, y, id){
    dragons.gameElements.element.call(this, radius * 2, radius * 2, x, y, id);
    this.radius = radius;
    this.color  = "#5AF51D";

    this.draw = function(ctx){
      ctx.save();
      
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.fillStyle = this.color;
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
      ctx.fill();

      ctx.restore();
    };
  };

  syncError = function(element){
    return function(err){
      console.log("error", err);
      alert("Unable to sync map. Uh-oh");
      element.outOfSync = true;
    };
  };

  syncSuccess = function(element){
    return function(data){
      if (data.error !== 0){
        console.log("error syncing data", data);
        element.outOfSync = true;
        return alert("Problem saving data. We're on it!");
      }
    };
  };
}());
