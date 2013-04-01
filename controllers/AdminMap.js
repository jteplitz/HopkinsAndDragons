(function(){
  "use strict";

  var base = require("./base.js"),
      ViewClass = require("../views/AdminMap.js"),

      AdminMapCtrl, _ptype;

  AdminMapCtrl = function(schemas){
    this.schemas = schemas;
    this.payload = {title: "Change Map Pieces"};
    this._view   = new ViewClass();
  };

  _ptype = AdminMapCtrl.prototype = base.getProto("std");
  _ptype._name = "AdminMap";

  _ptype.addPiece = function(pieceInfo, cb){
    var mapPiece = new this.schemas.BaseMapPiece({
      image: pieceInfo.image, // TODO: save this image in s3
      doorLeft: pieceInfo.doorLeft,
      doorRight: pieceInfo.doorRight,
      doorTop: pieceInfo.doorTop,
      doorBottom: pieceInfo.doorBottom
    });
    mapPiece.save(cb);
  };

  module.exports = AdminMapCtrl;
}());
