(function(){
  "use strict";

  var base = require("./base.js"),
      ViewClass = require("../views/AdminEnemy.js"),
      _         = require("underscore"),

      AdminEnemiesCtrl, _ptype;

  AdminEnemiesCtrl = function(schemas, conf, enemyId){
    this.schemas = schemas;
    this.conf    = conf;
    this.enemyId = enemyId;

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
    if (_.isNull(this.enemyId) || _.isUndefined(this.enemyId)){
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
    } else {
      this.schemas.BaseEnemy.findOne({_id: this.enemyId}, function(err, enemy){
        enemy.name    = enemyData.name;
        enemy.type    = enemyData.type;
        enemy.level   = enemyData.level;
        enemy.armor   = enemyData.armor;
        enemy.health  = enemyData.health;
        enemy.attacks = attacks;

        enemy.save(cb);
      });
    }
  };

  _ptype.prePrep = function(data, cb){
    console.log("prePrep", this.enemyId);
    if (_.isNull(this.enemyId) || _.isUndefined(this.enemyId)){
      data.enemy = {
        name: "",
        type: "",
        level: 1,
        armor: 0,
        health: 0,
        image: "",
        attacks: []
      };
      return cb();
    } else {
      this.schemas.BaseEnemy.findOne({_id: this.enemyId}, function(err, enemy){
        if (err){ return cb(err) }

        data.enemy = enemy;
        cb();
      });
    }
  };

  module.exports = AdminEnemiesCtrl;
}());
