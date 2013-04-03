/*globals dragons _*/
(function(){
  "use strict";

  // globals
  var dragging = false, canvas, selectedPiece;

  // functions
  var startDragging, dragPiece, stopDragging, placePiece, main, restoreMap, addPiece,
      selectPiece, rotatePiece,
      sync, syncError, syncSuccess,
      handleMapClick,

      // classes
      RoomElement;

  $(document).ready(function(){
    //$(".basePiece").on("drag", startDragging);
    $(document).on("mousemove", dragPiece);
    $(".basePiece").on("mousedown", startDragging);
    $(document).on("mouseup", ".dragging", stopDragging);
    $(".basePiece").on("dragstart", function(e){ e.preventDefault() }); // prevent browser dragging from getting in the way
    $("#rotatePiece").on("click", rotatePiece);

    $("#map").click(handleMapClick);

    canvas = new dragons.canvas($("#map")[0]);
    
    restoreMap();
    setInterval(main, 50); // main canvas loop
    setInterval(sync, 2000);
  });

  // goes through the game elements and syncs them if need be
  sync = function(){
    for (var i = 0; i < canvas.elements.length; i++){
      if (canvas.elements[i].outOfSync && _.has(canvas.elements[i], "_id")){
        var data = {
          type: "room",
          id: canvas.elements[i]._id,
          x: canvas.elements[i].x,
          y: canvas.elements[i].y,
          rotate: canvas.elements[i].rotate
        };
        $.ajax({
          url: window.location.pathname,
          type: "PUT",
          dataType: "json",
          data: data,
          failure: syncError(canvas.elements[i]),
          sucess: syncSuccess(canvas.elements[i])
        });
        canvas.elements[i].outOfSync = false;
      }
    }
  };

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
    var divideWidth = dragons.globals.map.roomWidth, divideHeight = dragons.globals.map.roomHeight,
        canvasElement;

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
      canvasElement = addPiece(mapImage, mapPiece)();
      selectPiece(canvasElement);
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
        mapPiece._id = data.piece._id;
        canvasElement._id = data.piece._id;
      }
    });
  };

  main = function(){
    canvas.update();
  };

  // selects a piece. Just sets a var for now, but will add color and stuff later
  selectPiece = function(piece){

    // remove last selected block
    for (var i = 0; i < canvas.elements.length; i++){
      if (canvas.elements[i] instanceof dragons.gameElements.colorBlock && canvas.elements[i].selectedBlock){
        canvas.elements.splice(i, 1);
        i--;
      }
    }
    // draw a color block around the selected piece
    var selectBlock = new dragons.gameElements.colorBlock("#4AD8FF", piece.width, piece.height, piece.x, piece.y);
    selectBlock.selectedBlock = true;
    canvas.elements.unshift(selectBlock);

    selectedPiece = piece;
  };

  // a synchronous function that casts the map pieces and places them back in the
  restoreMap = function(){
    for (var i = 0; i < dragons.map.length; i++){
      var pieceImage = new Image();
      pieceImage.onload = addPiece(pieceImage, dragons.map[i], dragons.map[i]._id);
      pieceImage.src = dragons.map[i].basePiece.image;
    }
  };

  // adds a loaded piece to the canvas
  addPiece = function(image, mapPiece, id){
    return function(){
      var piece = new RoomElement(image, dragons.globals.map.roomWidth, dragons.globals.map.roomHeight,
                                                 mapPiece.x, mapPiece.y, mapPiece.rotate, id);
      canvas.addElement(piece);
      return piece;
    };
  };

  // rotates the selected piece
  rotatePiece = function(){
    selectedPiece.rotate++;
    selectedPiece.rotate    = selectedPiece.rotate % 4;
    selectedPiece.outOfSync = true;
  };

  handleMapClick = function(e){
    // figure out which element they clicked on
    for (var i = 0; i < canvas.elements.length; i++){
      // check that it is a map piece and if so test for click
      if (canvas.elements[i] instanceof RoomElement && dragons.utils.detectMouseOver(canvas.elements[i], e, $("#map").offset())){
        selectPiece(canvas.elements[i]);
        return;
      }
    }
  };

  syncError = function(element){
    return function(err){
      console.log("error", err);
      alert("Unable to sync map. Uh-oh");
    };
  };

  syncSuccess = function(element){
    return function(data){
      if (data.err !== 0){
        console.log("error syncing data", data);
        return alert("Problem saving data. We're on it!");
      }
    };
  };

  RoomElement = function(image, width, height, x, y, rotate, id){
    dragons.gameElements.image.call(this, image, width, height, x, y, rotate, id);
  };
}());
