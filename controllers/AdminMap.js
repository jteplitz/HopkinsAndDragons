(function(){
  "use strict";

  var base = require("./base.js"),
      ViewClass = require("../views/AdminMap.js"),
      AWS       = require("aws-sdk"),

      AdminMapCtrl, _ptype,

      generateRandomName;

  AdminMapCtrl = function(schemas, config){
    this.schemas = schemas;
    this.conf    = config;
    this.payload = {title: "Change Map Pieces"};
    this._view   = new ViewClass();

    AWS.config.update(config.get("s3"));
  };

  _ptype = AdminMapCtrl.prototype = base.getProto("std");
  _ptype._name = "AdminMap";

  _ptype.addPiece = function(pieceInfo, cb){
    var self = this;
    var s3Data = {
      Bucket: this.conf.get("s3:bucket"),
      Key: generateRandomName(10) + ".png",
      Body: pieceInfo.image,
      ACL: "public-read"
    };
    var s3 = new AWS.S3();
    s3.client.putObject(s3Data, function(res){
      console.log("saved at", "http://s3.amazonaws.com/" + self.conf.get("s3:bucket") + "/" + s3Data.Key); // TODO: save this image in s3
      var mapPiece = new self.schemas.BaseMapPiece({
        image: "http://s3.amazonaws.com/" + self.conf.get("s3:bucket") + "/" + s3Data.Key, // TODO: save this image in s3
        doorLeft: pieceInfo.doorLeft,
        doorRight: pieceInfo.doorRight,
        doorTop: pieceInfo.doorTop,
        doorBottom: pieceInfo.doorBottom
      });
      console.log("saving", mapPiece);
      mapPiece.save(cb);
    });
  };
  
  generateRandomName = function(length){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < length; i++){
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  };
  module.exports = AdminMapCtrl;
}());
