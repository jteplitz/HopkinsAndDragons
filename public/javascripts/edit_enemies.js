/*globals dragons _*/
(function(){
  "use strict";

  // globals
  var canvas, mapPieces = [], enemies = [], dragging = false, selectedEnemy,

  // functions
  main, restoreMap, addPiece, addEnemy, PullRadius, Enemy,
  startDragging, dragPiece, stopDragging, removeDraggingPullRadius, changeRadius;

  dragons.organizedMap = {};

  $(document).ready(function(){
    $(".baseEnemy").on("mousedown", startDragging);
    $(document).on("mousemove", dragPiece);
    $(document).on("mouseup", ".dragging", stopDragging);
    $(".baseEnemy").on("dragstart", function(e){ e.preventDefault() }); // prevent browser dragging from getting in the way

    $(".enemyProperties .pullRadius").on("change", changeRadius);

    canvas = new dragons.canvas($("#map")[0]);
    restoreMap();
    setInterval(main, 20); // main canvas loop
  });

  main = function(){
    canvas.update();
  };

  startDragging = function(e){
    if (!dragging){
      var baseEnemy = null;
      // populate the stats
      for (var i = 0; i < dragons.baseEnemies.length; i++){
        if (dragons.baseEnemies[i]._id === $(this).attr("data-id")){
          baseEnemy = dragons.baseEnemies[i];
          break;
        }
      }
      $("h3.enemyName").text(baseEnemy.name);
      $(".enemyProperties .level").val(baseEnemy.level);
      $(".enemyProperties .type").val(baseEnemy.type);
      $(".enemyProperties .health").val(baseEnemy.health);
      $(".enemyProperties .armor").val(baseEnemy.armor);
      $(".enemyProperties .pullRadius").val(20);

      $(".enemyProperties").removeClass("hidden");

      dragging = true;

      var piece = $(this).clone();
      piece.addClass("dragging");
      piece.attr("data-startX", $(this).offset().left);
      piece.attr("data-startY", $(this).offset().top);
      $("body").append(piece);

      dragPiece(e);
    }
  };

  dragPiece = function(e){
    var i;
    if (dragging){
      $(".dragging").css("top", e.pageY + "px");
      $(".dragging").css("left", e.pageX + "px");

      if (dragons.utils.detectMouseOver($("#map"), e)){
        // if the piece is over the map display its pull radius (20 px by default)
        var x = ($(".dragging").position().left - $("#map").offset().left) + ($(".dragging").width() / 2);
        var y = ($(".dragging").position().top - $("#map").offset().top)  + ($(".dragging").height() / 2);

        // remove the old dragging pull radius
        removeDraggingPullRadius();

        var pullRadius = new PullRadius(20, x, y, "#32B7F0");
        pullRadius.dragging = true;
        canvas.addElement(pullRadius);
      } else {
        // remove the old dragging pull radius if it was there
        removeDraggingPullRadius();
      }
    }
  };

  stopDragging = function(e){
    dragging = false;
    // TODO Make sure enemies can't collide, and check wall collision, and check that we're on a piece
    if (dragons.utils.detectMouseOver($("#map"), e)){
      var enemyImage = new Image();

      enemyImage.onload = function(){
        var x = e.pageX - $("#map").offset().left, y = e.pageY - $("#map").offset().top;
        var enemy = new Enemy(enemyImage, $(".dragging").width(), $(".dragging").height(),
                              x, y, 20, $(".dragging").attr("data-id"));
        canvas.addElement(enemy);
        removeDraggingPullRadius();
        selectedEnemy = enemy;
        $.ajax({
          type: "PUT",
          url: window.location.pathname,
          data: {
            baseEnemy: $(".dragging").attr("data-id"),
            x: x,
            y: y,
            pullRadius: 20
          }
        });
        $(".dragging").remove();
      };

      enemyImage.src = $(".dragging").attr("src");
    } else { // fly the enemy away
      $(".dragging").animate({
        left: $(".dragging").attr("data-startX") + "px",
        top: $(".dragging").attr("data-startY") + "px"
      }, {
        duration: 200,
        complete: function(){
          $(this).remove();
        }
      });
    }
  };

  changeRadius = function(){
    var radius = $(this).val();

    selectedEnemy.setRadius(radius);
  };

  removeDraggingPullRadius = function(){
    var i;
    for (i = 0; i < canvas.elements.length; i++){
      if (canvas.elements[i] instanceof PullRadius && canvas.elements[i].dragging){
        canvas.elements.splice(i, 1);
        break;
      }
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
      var enemy = new Enemy(image, 25, 25, enemyData.x, enemyData.y, enemyData.pullRadius, enemyData._id);
      canvas.addElement(enemy);
      return enemy;
    };
  };


  PullRadius = function(radius, x, y, color){
    dragons.gameElements.element.call(this, radius, radius, x, y, null);

    this.radius = radius;
    this.color  = color;

    this.draw = function(ctx){
      ctx.save();
      
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.fillStyle = this.color;
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
      ctx.fill();

      ctx.restore();
    };
  };

  Enemy = function(image, width, height, x, y, pullRadius, id){
    dragons.gameElements.element.call(this, width, height, x, y, id);

    this.image      = new dragons.gameElements.image(image, width, height, x, y, 0, id);
    this.pullRadius = new PullRadius(pullRadius, x + (width / 2), y + (height / 2), "#32B7F0");

    this.draw = function(ctx){
      this.pullRadius.draw(ctx);
      this.image.draw(ctx);
    };

    this.setRadius = function(radius){
      this.pullRadius = new PullRadius(radius, x + (width / 2), y + (height / 2), "#32B7F0");
    };
  };
}());
