(function(){
  "use strict";

  var mongoose = require("mongoose"),
      _        = require("underscore"),

      Schema   = mongoose.Schema,
      Mixed    = Schema.Types.Mixed,

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
    _id: Number
  });

  var Game = new Schema({
    name: String,
    players: [Number],
    owner: Number,
    map: Mixed
  });

  exports.User = mongoose.model("User", User);
  exports.Game = mongoose.model("Game", Game);

}());
