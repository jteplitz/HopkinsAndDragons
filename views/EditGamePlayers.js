(function(){
  "use strict";
  
  var base = require("./base.js");


  var EditGamePlayersView, _ptype;

  EditGamePlayersView = function(){};

  _ptype = EditGamePlayersView.prototype = base.getProto("std");
  _ptype._view_name = "EditGamePlayersView";
  _ptype._template  = "editGamePlayers.jade";

  module.exports = EditGamePlayersView;
}());
