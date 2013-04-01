/*globals dragons _*/
(function(){
  "use strict";

  // globals
  var dragging = false, canvas;

  // functions
  var startDragging, dragPiece, stopDragging, placePiece, main, restoreMap, addPiece;

  $(document).ready(function(){
    //$(".basePiece").on("drag", startDragging);
    $(document).on("mousemove", dragPiece);
    $(".basePiece").on("mousedown", startDragging);
    $(document).on("mouseup", ".dragging", stopDragging);
    $(".basePiece").on("dragstart", function(e){ e.preventDefault() }); // prevent browser dragging from getting in the way

    canvas = new dragons.canvas($("#map")[0]);
    
    restoreMap();
    setInterval(main, 50); // main canvas loop
  });

  startDragging = function(e){
    if (!dragging){
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
    if (dragging){
      $(".dragging").css("top", e.pageY + "px");
      $(".dragging").css("left", e.pageX + "px");
    }
  };

  stopDragging = function(e){
    dragging = false;
    if (dragons.utils.detectMouseOver($("#map"), e)){
      placePiece($(this), e);
    } else { // fly the temp piece away
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

  // place a new piece on the map
  placePiece = function(piece, e){
    var divideWidth = dragons.globals.map.roomWidth, divideHeight = dragons.globals.map.roomHeight;

    // get position relative to canvas
    var pieceX = e.pageX - $("#map").offset().left,
        pieceY = e.pageY - $("#map").offset().top;

    // place it in the proper place
    pieceX = Math.round((pieceX / divideWidth)) * divideWidth;
    pieceY = Math.round((pieceY / divideHeight)) * divideHeight;

    var basePiece;
    for (var i = 0; i < dragons.basePieces.length; i++){
      if (dragons.basePieces[i]._id === piece.attr("data-id")){
        basePiece = dragons.basePieces[i];
      }
    }
    if (_.isUndefined(basePiece)){
      console.log("well, that went seriously wrong");
      return alert("Serious problem");
    }
    var mapPiece = {
      basePiece: basePiece,
      x: pieceX,
      y: pieceY
    };

    dragons.map.push(mapPiece);

    // add the image to the canvas
    var mapImage = new Image(), tempPiece = this;
    mapImage.onload = function(){
      addPiece(mapImage, mapPiece)();
      piece.remove();
    };
    mapImage.src = piece.attr("src");

    $.ajax({
      url: window.location.pathname,
      type: "post",
      data: _.extend(mapPiece, {type: "addRoom"}),
      dataType: "json",
      failure: function(err){
        console.log(err);
        alert("unable to save map");
      },
      success: function(data){
        if (data.err){
          console.log(data.err);
          return alert("unable to save map");
        }
        mapPiece._id = data._id;
      }
    });
  };

  main = function(){
    canvas.update();
  };

  // a synchronous function that casts the map pieces and places them back in the
  restoreMap = function(){
    for (var i = 0; i < dragons.map.length; i++){
      var pieceImage = new Image();
      pieceImage.onload = addPiece(pieceImage, dragons.map[i]);
      pieceImage.src = dragons.map[i].basePiece.image;
    }
  };

  // adds a loaded piece to the canvas
  addPiece = function(image, mapPiece){
    return function(){
      var piece = new dragons.gameElements.image(image, dragons.globals.map.roomWidth, dragons.globals.map.roomHeight,
                                                 mapPiece.x, mapPiece.y);
      canvas.addElement(piece);
    };
  };

}());
