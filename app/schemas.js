(function(){
  "use strict";

  var mongoose = require("mongoose"),
      _        = require("underscore"),

      Schema   = mongoose.Schema,
      Mixed    = Schema.Types.Mixed,
      ObjectId = Schema.Types.ObjectId,

      validateEmail, validatePresenceOf;

  validatePresenceOf = function(value){
    return value && value.length;
  };

  validateEmail = function(value){
    var emailRegex = new RegExp(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/);
    return emailRegex.test(value);
  };

  var User = new Schema({
    firstName: String,
    lastName: String,
    email: {type: String, validate: [validateEmail, "a valid email is required"], index: {unique: true}},
    password: {type: String, validate: [validatePresenceOf, "a password is required"]},
    salt: String,
    _id: Number,
    admin: {type: Boolean, "default": false}
  });

  var BaseMapPiece = new Schema({
    image: String,
    doorLeft: Boolean,
    doorRight: Boolean,
    doorTop: Boolean,
    doorBottom: Boolean
  });

  var MapPiece = new Schema({
    basePiece: Object,
    x: Number,
    y: Number
  });

  var Game = new Schema({
    name: String,
    players: [Number],
    owner: Number,
    map: [MapPiece]
  });

  exports.User         = mongoose.model("User", User);
  exports.Game         = mongoose.model("Game", Game);
  exports.BaseMapPiece = mongoose.model("BaseMapPiece", BaseMapPiece);
  exports.MapPiece     = mongoose.model("MapPiece", MapPiece);
}());
