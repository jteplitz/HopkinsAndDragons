(function(){
  "use strict";

  var base = require("./base.js"),
      ViewClass = require("../views/EditGameEnemies.js"),

      EditGameEnemiesCtrl, _ptype;

  EditGameEnemiesCtrl = function(){
    this.payload = {title: ""};
    this._view   = new ViewClass();
  };

  _ptype = EditGameEnemiesCtrl.prototype = base.getProto("std");
  _ptype._name = "EditGameEnemies";

  module.exports = EditGameEnemiesCtrl;
}());
