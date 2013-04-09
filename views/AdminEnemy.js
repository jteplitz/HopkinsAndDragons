(function(){
  "use strict";
  
  var base = require("./base.js");


  var AdminEnemiesView, _ptype;

  AdminEnemiesView = function(){};

  _ptype = AdminEnemiesView.prototype = base.getProto("std");
  _ptype._view_name = "AdminEnemiesView";
  _ptype._template  = "adminEnemy.jade";

  module.exports = AdminEnemiesView;
}());
