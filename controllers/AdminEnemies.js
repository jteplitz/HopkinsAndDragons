(function(){
  "use strict";

  var base = require("./base.js"),
      ViewClass = require("../views/AdminEnemies.js"),

      AdminEnemiesCtrl, _ptype;

  AdminEnemiesCtrl = function(schemas, conf){
    this.schemas = schemas;
    this.conf    = conf;
    this.payload = {title: "Enemy Admin"};
    this._view   = new ViewClass();
  };

  _ptype = AdminEnemiesCtrl.prototype = base.getProto("std");
  _ptype._name = "AdminEnemies";

  _ptype.addEnemy = function(enemyData, attacksData, cb){
    var attacks = [];
    for (var i = 0; i < attacksData.length; i++){
      attacks.push(new this.schemas.EnemyAttack({
        name: attacksData[i].name,
        hitChance: attacksData[i].hit_percent,
        minDamage: attacksData[i].min_damage,
        maxDamage: attacksData[i].max_damage
      }));
    }
    var enemy = new this.schemas.BaseEnemy({
      name: enemyData.name,
      type: enemyData.type,
      level: enemyData.level,
      armor: enemyData.armor,
      health: enemyData.health,
      image: enemyData.image,
      attacks: attacks
    });

    enemy.save(cb);
  };

  module.exports = AdminEnemiesCtrl;
}());
