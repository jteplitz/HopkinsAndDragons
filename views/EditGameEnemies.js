(function(){
  "use strict";
  
  var base = require("./base.js");


  var EditGameEnemiesView, _ptype;

  EditGameEnemiesView = function(){};

  _ptype = EditGameEnemiesView.prototype = base.getProto("std");
  _ptype._view_name = "EditGameEnemiesView";
  _ptype._template  = "editGameEnemies.jade";

  module.exports = EditGameEnemiesView;
}());
