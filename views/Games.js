(function(){
  "use strict";
  
  var base = require("./base.js");


  var GamesView, _ptype;

  GamesView = function(){};

  _ptype = GamesView.prototype = base.getProto("std");
  _ptype._view_name = "GamesView";
  _ptype._template  = "games.jade";

  module.exports = GamesView;
}());
