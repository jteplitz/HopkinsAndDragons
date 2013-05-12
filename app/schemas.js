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
    image: String,
    doorLeft: Boolean,
    doorRight: Boolean,
    doorTop: Boolean,
    doorBottom: Boolean,
    x: Number,
    y: Number,
    rotate: Number
  });

  var EnemyAttack = new Schema({
    name: String,
    hitChance: Number,
    minDamage: Number,
    maxDamage: Number
  });

  var BaseEnemy = new Schema({
    name: String,
    type: String,
    level: Number,
    armor: Number,
    health: Number,
    image: String,
    attacks: [EnemyAttack]
  });

  var Enemy = new Schema({
    baseEnemy: ObjectId,
    x: Number,
    y: Number,
    pullRadius: Number
  });

  var Player = new Schema({
    name: String,
    image: String,
    attacks: Mixed,
    x: Number,
    y: Number,
    level: Number,
    owner: Number
  });

  var StoryPoint = new Schema({
    text: String,
    x: Number,
    y: Number,
    Enemy: ObjectId
  });

  var Game = new Schema({
    name: String,
    players: [Player],
    enemies: [Enemy],
    story: [StoryPoint],
    map: [MapPiece],
    fog: String,
    backgroundStory: String,
    endStory: String,
    owner: Number
  });

  exports.User         = mongoose.model("User", User);
  exports.Game         = mongoose.model("Game", Game);
  exports.BaseMapPiece = mongoose.model("BaseMapPiece", BaseMapPiece);
  exports.MapPiece     = mongoose.model("MapPiece", MapPiece);
  exports.EnemyAttack  = mongoose.model("EnemyAttack", EnemyAttack);
  exports.BaseEnemy    = mongoose.model("BaseEnemy", BaseEnemy);
  exports.Enemy        = mongoose.model("Enemy", Enemy);
  exports.Player       = mongoose.model("Player", Player);
  exports.StoryPoint   = mongoose.model("StoryPoint", StoryPoint);
}());
