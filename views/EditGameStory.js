(function(){
  "use strict";
  
  var base = require("./base.js");


  var EditGameStoryView, _ptype;

  EditGameStoryView = function(){};

  _ptype = EditGameStoryView.prototype = base.getProto("std");
  _ptype._view_name = "EditGameStoryView";
  _ptype._template  = "editGameStory.jade";

  module.exports = EditGameStoryView;
}());
