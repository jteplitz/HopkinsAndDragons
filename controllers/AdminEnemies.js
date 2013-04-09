(function(){
  "use strict";

  var base = require("./base.js"),
      ViewClass = require("../views/AdminEnemies.js"),

      AdminEnemiesCtrl, _ptype;

  AdminEnemiesCtrl = function(schemas, conf){
    this.schemas = schemas;
    this.conf    = conf;

    this.payload = {title: "Enemies Admin"};
    this._view   = new ViewClass();
  };

  _ptype = AdminEnemiesCtrl.prototype = base.getProto("std");
  _ptype._name = "AdminEnemies";

  _ptype.prePrep = function(data, cb){
    this.schemas.BaseEnemy.find({}, function(err, enemies){
      if (err){ return cb(err) }

      data.enemies = enemies;
      cb();
    });
  };

  module.exports = AdminEnemiesCtrl;
}());
