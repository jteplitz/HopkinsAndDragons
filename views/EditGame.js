(function(){
  "use strict";
  
  var base = require("./base.js");


  var EditGameView, _ptype;

  EditGameView = function(){};

  _ptype = EditGameView.prototype = base.getProto("std");
  _ptype._view_name = "EditGameView";
  _ptype._template  = "editGame.jade";

  module.exports = EditGameView;
}());
