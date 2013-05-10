var isServer = (typeof _ === "undefined");
var dragons  = (dragons instanceof Object) ? dragons : {};
var _        = (_ instanceof Object)       ? _       : require("underscore");
var $        = ($ instanceof Object) ? $ : {};

(function(){
  "use strict";

  dragons.combat = function(){
    var enemies = [],
        players = {};

    this.start = function(enemies){
      this.enemies = enemies;

      if (!isServer){
        $("#combatModal").modal("show");
      }
    };
  };

  if (isServer){
    module.exports = dragons.combat;
  }
}());
