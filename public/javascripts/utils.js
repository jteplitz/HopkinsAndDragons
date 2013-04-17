/*globals dragons _*/
(function(){
  "use strict";
 
  dragons.utils = {
    detectMouseOver: function(element, e, offset){
      var position;
      if (! (element instanceof $)){
        position = {
          left: element.x + offset.left,
          right: element.x + element.width + offset.left,
          top: element.y + offset.top,
          bottom: element.y + element.height + offset.top
        };
      } else {
        position        = element.offset();
        position.right  = position.left + element.width();
        position.bottom = position.top + element.height();
      }
      return (position.right > e.pageX &&
              position.left < e.pageX                 &&
              position.top < e.pageY                  &&
              position.bottom > e.pageY);
    },

    buildMap: function(map){
      for (var i = 0; i < map.length; i++){
        var mapPiece = map[i];
        if (!_.has(dragons.organizedMap, mapPiece.x)){
          dragons.organizedMap[mapPiece.x] = {};
        }

        dragons.organizedMap[mapPiece.x][mapPiece.y] = mapPiece;
      }
    },

    // ensures that globals are of the proper type
    cleanGlobals: function(){
      dragons.globals.map.roomWidth = parseInt(dragons.globals.map.roomWidth, 10);
      dragons.globals.map.roomHeight = parseInt(dragons.globals.map.roomHeight, 10);
    }
  };
}());
