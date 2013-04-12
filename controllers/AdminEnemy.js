(function(){
  "use strict";

  var base = require("./base.js"),
      ViewClass = require("../views/AdminEnemy.js"),
      _         = require("underscore"),
      AWS       = require("aws-sdk"),

      AdminEnemiesCtrl, _ptype,

      generateRandomName;

  AdminEnemiesCtrl = function(schemas, conf, enemyId){
    this.schemas = schemas;
    this.conf    = conf;
    this.enemyId = enemyId;

    this.payload = {title: "Enemy Admin"};
    this._view   = new ViewClass();

    AWS.config.update(conf.get("s3"));
  };

  _ptype = AdminEnemiesCtrl.prototype = base.getProto("std");
  _ptype._name = "AdminEnemies";

  _ptype.addEnemy = function(enemyData, attacksData, cb){
    var self = this;
    var attacks = [];
    
    // create the attack objects
    for (var i = 0; i < attacksData.length; i++){
      attacks.push(new this.schemas.EnemyAttack({
        name: attacksData[i].name,
        hitChance: attacksData[i].hit_percent,
        minDamage: attacksData[i].min_damage,
        maxDamage: attacksData[i].max_damage
      }));
    }

    // either update or save
    if (_.isNull(this.enemyId) || _.isUndefined(this.enemyId)){
      // save the image in s3
      var s3Data = {
        Bucket: this.conf.get("s3:bucket"),
        Key: generateRandomName(10) + ".png",
        Body: enemyData.image,
        ACL: "public-read"
      };
      console.log("saving", s3Data);
      var s3 = new AWS.S3();
      s3.client.putObject(s3Data, function(res){
        console.log("enemy saved", res);
        var enemy = new self.schemas.BaseEnemy({
          name: enemyData.name,
          type: enemyData.type,
          level: enemyData.level,
          armor: enemyData.armor,
          health: enemyData.health,
          image: "http://s3.amazonaws.com/" + self.conf.get("s3:bucket") + "/" + s3Data.Key,
          attacks: attacks
        });
        enemy.save(cb);
      });

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

  generateRandomName = function(length){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < length; i++){
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  };

  module.exports = AdminEnemiesCtrl;
}());
