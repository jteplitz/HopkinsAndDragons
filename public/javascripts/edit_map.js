/*globals dragons _*/ (function(){
  "use strict";

  // globals
  var dragging = false, canvas, selectedPiece, mapPieces = [];

  // functions
  var startDragging, dragPiece, stopDragging, placePiece, main, restoreMap, addPiece,
      selectPiece, deselectPiece, rotatePiece, deletePiece, createOpenBlock,
      checkPiece,
      sync, syncError, syncSuccess,
      handleMapClick,

      // classes
      RoomElement;

  dragons.organizedMap = {};


  $(document).ready(function(){
    //$(".basePiece").on("drag", startDragging);
    $(document).on("mousemove", dragPiece);
    $(".basePiece").on("mousedown", startDragging);
    $(document).on("mouseup", ".dragging", stopDragging);
    $(".basePiece").on("dragstart", function(e){ e.preventDefault() }); // prevent browser dragging from getting in the way
    $("#rotatePiece").on("click", rotatePiece);
    $("#deletePiece").on("click", deletePiece);

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
          rotate: canvas.elements[i].rotate,
          doorLeft: canvas.elements[i].doorLeft,
          doorRight: canvas.elements[i].doorRight,
          doorTop: canvas.elements[i].doorTop,
          doorBottom: canvas.elements[i].doorBottom
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

      // highlight available drop areas
      for (var i = 0; i < mapPieces.length; i++){
        var mapPiece = mapPieces[i];
        // check for piece on left
        if (mapPiece.doorLeft){
          if(!checkPiece(mapPiece.x - dragons.globals.map.roomWidth, mapPiece.y)){
            createOpenBlock(mapPiece.x - dragons.globals.map.roomWidth, mapPiece.y);
          }
        }

        if (mapPiece.doorRight){
          if (!checkPiece(mapPiece.x + dragons.globals.map.roomWidth, mapPiece.y)){
            createOpenBlock(mapPiece.x + dragons.globals.map.roomWidth, mapPiece.y);
          }
        }

        if (mapPiece.doorTop){
          if (!checkPiece(mapPiece.x, mapPiece.y - dragons.globals.map.roomHeight)){
            createOpenBlock(mapPiece.x, mapPiece.y - dragons.globals.map.roomHeight);
          }
        }

        if (mapPiece.doorBottom){
          if (!checkPiece(mapPiece.x, mapPiece.y + dragons.globals.map.roomHeight)){
            createOpenBlock(mapPiece.x, mapPiece.y + dragons.globals.map.roomHeight);
          }
        }
      }
    }
  };

  // checks if a room exists at a given location
  checkPiece = function(x, y){
    return (_.has(dragons.organizedMap, x) && _.has(dragons.organizedMap[x], y));
  };

  // highlights an available area on the map
  createOpenBlock = function(x, y){
    var openBlock = new dragons.gameElements.colorBlock("#00FF00", dragons.globals.map.roomWidth, dragons.globals.map.roomHeight,
                                                                     x, y);
    openBlock.open = true;
    canvas.elements.push(openBlock);
  };

  dragPiece = function(e){
    if (dragging){
      $(".dragging").css("top", e.pageY + "px");
      $(".dragging").css("left", e.pageX + "px");
    }
  };

  stopDragging = function(e){
    var divideWidth = dragons.globals.map.roomWidth, divideHeight = dragons.globals.map.roomHeight;
    var pieceX = e.pageX - $("#map").offset().left,
        pieceY = e.pageY - $("#map").offset().top;

    // place it in the proper place
    pieceX = Math.round((pieceX / divideWidth)) * divideWidth;
    pieceY = Math.round((pieceY / divideHeight)) * divideHeight;

    dragging = false;
    if (dragons.utils.detectMouseOver($("#map"), e) && !checkPiece(pieceX, pieceY)){
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

    // remove color blocks
    for (var i = 0; i < canvas.elements.length; i++){
      if ((canvas.elements[i] instanceof dragons.gameElements.colorBlock) && canvas.elements[i].open){
        canvas.elements.splice(i, 1);
        i--;
      }
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
      basePiece: basePiece._id,
      doorLeft: basePiece.doorLeft,
      doorRight: basePiece.doorRight,
      doorBottom: basePiece.doorBottom,
      doorTop: basePiece.doorTop,
      x: pieceX,
      y: pieceY,
      rotate: 0
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

    if (mapPiece.x >= $("#map").width() - 150){
      $("#map")[0].width = ($("#map").width() + 200);
    }
    
    if (mapPiece.y >= $("#map").height() + 150){
      $("#map")[0].height = ($("#map").height() + 200);
    }
  };

  main = function(){
    canvas.update();
  };

  // selects a piece. Just sets a var for now, but will add color and stuff later
  selectPiece = function(piece){
    deselectPiece();

    // draw a color block around the selected piece
    var selectBlock = new dragons.gameElements.colorBlock("#4AD8FF", piece.width, piece.height, piece.x, piece.y);
    selectBlock.selectedBlock = true;
    canvas.elements.push(selectBlock);

    selectedPiece = piece;
  };

  deselectPiece = function(){
    // remove last selected block
    for (var i = 0; i < canvas.elements.length; i++){
      if (canvas.elements[i] instanceof dragons.gameElements.colorBlock && canvas.elements[i].selectedBlock){
        canvas.elements.splice(i, 1);
        i--;
      }
    }
    selectedPiece = null;
  };

  // a synchronous function that casts the map pieces and places them back in the
  restoreMap = function(){
    for (var i = 0; i < dragons.map.length; i++){
      var pieceImage = new Image();
      pieceImage.onload = addPiece(pieceImage, dragons.map[i], dragons.map[i]._id);
      pieceImage.src = dragons.map[i].image;
    }
  };

  // adds a loaded piece to the canvas
  addPiece = function(image, mapPiece, id){
    return function(){
      var piece = new RoomElement(image, dragons.globals.map.roomWidth, dragons.globals.map.roomHeight,
                                                 mapPiece.x, mapPiece.y, mapPiece.rotate, mapPiece.doorLeft, mapPiece.doorRight,
                                                 mapPiece.doorTop, mapPiece.doorBottom, id);
      canvas.addElement(piece);
      mapPieces.push(piece);
      dragons.utils.buildMap(mapPieces); // organize the map object for easier editing access
      return piece;
    };
  };

  // rotates the selected piece
  rotatePiece = function(){
    if (_.isNull(selectedPiece)){ return }

    selectedPiece.rotate++;
    selectedPiece.rotate    = selectedPiece.rotate % 4;

    var doorLeft = selectedPiece.doorLeft, doorRight = selectedPiece.doorRight;
    selectedPiece.doorLeft = selectedPiece.doorBottom;
    selectedPiece.doorRight = selectedPiece.doorTop;

    selectedPiece.doorBottom = doorRight;
    selectedPiece.doorTop  = doorLeft;
    selectedPiece.outOfSync = true;
  };

  deletePiece = function(){
    if (_.isNull(selectedPiece)){ return }
    $.ajax({
      url: window.location.pathname,
      type: "DELETE",
      dataType: "json",
      data: {type: "room", id: selectedPiece._id},
      failure: function(err){
        console.log("delete error", err);
        alert ("Unable to delete room");
      },
      success: function(data){
        if (data.error !== 0){
          console.log("delete error", data);
          alert ("Unable to delete room");
        }
      }
    });

    for (var i = 0; i < dragons.map.length; i++){
      if (dragons.map[i]._id === selectedPiece._id){
        dragons.map.splice(i, 1);
        break;
      }
    }

    for (i = 0; i < canvas.elements.length; i++){
      if (canvas.elements[i]._id === selectedPiece._id){
        canvas.elements.splice(i, 1);
        break;
      }
    }

    for (i = 0; i < mapPieces.length; i++){
      if (mapPieces[i]._id === selectedPiece._id){
        mapPieces.splice(i, 1);
        break;
      }
    }

    delete dragons.organizedMap[selectedPiece.x][selectedPiece.y];

    deselectPiece();
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

    // no hit
    deselectPiece();
  };

  syncError = function(element){
    return function(err){
      console.log("error", err);
      alert("Unable to sync map. Uh-oh");
    };
  };

  syncSuccess = function(element){
    return function(data){
      if (data.error !== 0){
        console.log("error syncing data", data);
        return alert("Problem saving data. We're on it!");
      }
    };
  };

  RoomElement = function(image, width, height, x, y, rotate, doorLeft, doorRight, doorTop, doorBottom, id){
    dragons.gameElements.image.call(this, image, width, height, x, y, rotate, id);

    this.doorLeft   = doorLeft;
    this.doorRight  = doorRight;
    this.doorTop    = doorTop;
    this.doorBottom = doorBottom;
  };
}());
