(function(){
  "use strict";
  
  var base = require("./base.js");


  var AdminMapView, _ptype;

  AdminMapView = function(){};

  _ptype = AdminMapView.prototype = base.getProto("std");
  _ptype._view_name = "AdminMapView";
  _ptype._template  = "adminMap.jade";

  module.exports = AdminMapView;
}());
