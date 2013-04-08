(function(){
  "use strict";

  var base = require("./base.js"),
      ViewClass = require("../views/AdminEnemies.js"),

      AdminEnemiesCtrl, _ptype;

  AdminEnemiesCtrl = function(){
    this.payload = {title: ""};
    this._view   = new ViewClass();
  };

  _ptype = AdminEnemiesCtrl.prototype = base.getProto("std");
  _ptype._name = "AdminEnemies";

  module.exports = AdminEnemiesCtrl;
}());
