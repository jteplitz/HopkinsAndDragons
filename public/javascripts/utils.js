var isServer = (typeof _ === "undefined");
var dragons  = (dragons instanceof Object) ? dragons : module.exports;
var _        = (_ instanceof Object) ? _ : require("underscore");
var $        = ($ instanceof Object) ? $ : {};

(function(){
  "use strict";

  var exports;
 
  exports = {
    setupConf: function(conf){
      dragons.globals = conf.get("gameGlobals");
      exports.cleanGlobals();
    },
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
      if (!_.has(dragons, "organizedMap")){
        dragons.organizedMap = {};
      }
      console.log("organizing pieces", map.length);
      for (var i = 0; i < map.length; i++){
        var mapPiece = map[i];
        if (!_.has(dragons.organizedMap, mapPiece.x)){
          dragons.organizedMap[mapPiece.x] = {};
        }

        dragons.organizedMap[mapPiece.x][mapPiece.y] = mapPiece;
      }
      return dragons.organizedMap;
    },

    // ensures that globals are of the proper type
    cleanGlobals: function(){
      dragons.globals.map.roomWidth = parseInt(dragons.globals.map.roomWidth, 10);
      dragons.globals.map.roomHeight = parseInt(dragons.globals.map.roomHeight, 10);
      dragons.globals.map.wallWidth  = parseInt(dragons.globals.map.wallWidth, 10);
      dragons.globals.map.wallHeight = parseInt(dragons.globals.map.wallHeight, 10);
      dragons.globals.physicsUpdateTime = parseInt(dragons.globals.physicsUpdateTime, 10);
      dragons.globals.serverSyncTime = parseInt(dragons.globals.serverSyncTime, 10);
      dragons.globals.playerSpeeed = parseInt(dragons.globals.playerSpeeed, 10);
      dragons.globals.fakeLag = parseInt(dragons.globals.fakeLag, 10);
      dragons.globals.netOffset = parseInt(dragons.globals.netOffset, 10);
      dragons.globals.bufferSize = parseInt(dragons.globals.bufferSize, 10);
      dragons.globals.clientSmooth = parseInt(dragons.globals.clientSmooth, 10);
      dragons.globals.saveGameTime = parseInt(dragons.globals.saveGameTime, 10);
    }
  };
  if (isServer){
    module.exports = exports;
  } else {
    dragons.utils = exports;
  }
}());
