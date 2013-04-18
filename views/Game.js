(function(){
  "use strict";
  
  var base = require("./base.js");


  var GameView, _ptype;

  GameView = function(){};

  _ptype = GameView.prototype = base.getProto("std");
  _ptype._view_name = "GameView";
  _ptype._template  = "game.jade";

  module.exports = GameView;
}());
