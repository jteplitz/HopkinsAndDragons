/*globals dragons*/
(function(){
  "use strict";

  // globals
  var canvas, mapPieces = [],

  // functions
  main, restoreMap, addPiece, RoomElement;

  dragons.organizedMap = {};

  $(document).ready(function(){
    canvas = new dragons.canvas($("#map")[0]);
    
    restoreMap();
    setInterval(main, 50); // main canvas loop
  });

  main = function(){
    canvas.update();
  };


  // maybe place the following three functions in some other file? canvas.js? map.js...
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
  RoomElement = function(image, width, height, x, y, rotate, doorLeft, doorRight, doorTop, doorBottom, id){
    dragons.gameElements.image.call(this, image, width, height, x, y, rotate, id);

    this.doorLeft   = doorLeft;
    this.doorRight  = doorRight;
    this.doorTop    = doorTop;
    this.doorBottom = doorBottom;
  };
}());
