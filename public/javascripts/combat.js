var isServer = (typeof _ === "undefined");
var dragons  = (dragons instanceof Object) ? dragons : {};
var _        = (_ instanceof Object)       ? _       : require("underscore");
var $        = ($ instanceof Object) ? $ : {};

(function(){
  "use strict";

  var buildAttacks, pickAttack, randRange;

  dragons.combat = function(enemies, players, yourID, conf){
    this.enemies = {};
    this.players = {};
    this.playerCount = 0;

    this.playerAttacks = [];
    this.enemyAttacks  = [];

    this.enemies = enemies;
    this.players = players;
    this.state   = null;

    // count the players
    for (var player in players){
      if (players.hasOwnProperty(player)){
        this.playerCount++;
      }
    }

    this.setupUI = function(){
      // clear the UI
      $("#combatModal .players").empty();
      $("#combatModal .enemies").empty();

      // load the players
      for (var player in this.players){
        if (this.players.hasOwnProperty(player)){
          var thisPlayer = this.players[player];
          $("#combatModal .players").append("<div class='player'>" +
                                            "<img src='" + thisPlayer.image.src + "' />" +
                                            "</div>");
        }
      }
      
      // load the enemies
      for (var enemy in this.enemies){
        if (this.enemies.hasOwnProperty(enemy)){
          var thisEnemy = this.enemies[enemy];
          $("#combatModal .enemies").append("<div class='enemy' data-id='" + thisEnemy._id + "'" + " >" +
                                            "<img src='" + thisEnemy.image.image.src + "' />" +
                                            "</div>");
        }
      }

      // load the player image
      $("#combatModal .portrait").attr("src", this.players[this.player].image.src);
      for (var i = 0; i < this.players[this.player].attacks.length; i++){
        var thisAttack = dragons.attacks[this.players[this.player].attacks[i]];
        
        $("#combatModal .attack" + (i + 1)).append("<img src='" + thisAttack.icon + "' " +
                                                  "data-toggle='tooltip' " +
                                                  "data-original-title=\"" +
                                                  this.players[this.player].attacks[i] + "<br />" +
                                                  "Hit: " + thisAttack.hit * 100 + "<br />" +
                                                  "Damage: " + thisAttack.minDamage + "-" + thisAttack.maxDamage +
                                                  "<br />" + "\" " +
                                                  "data-placement='right' data-html='true'" +
                                                  "/>");
      }
      $(".attack img").tooltip();
    };

    this.message = function(msg){
      $("#combatModal .messages").text(msg);
    };

    if (!isServer){
      this.player = yourID;
      $("#combatModal").modal("show");
      $("#dungeonMusic")[0].pause();

      this.setupUI();
    } else {
      dragons.attacks = buildAttacks(conf.get("players"));
      console.log("built attacks", dragons.attacks);
    }

    this.start = function(){
      if (!isServer){
        this.message("Select an attack");
        this.state = "attack";
      }
    };

    this.attack = function(player, attackNum, target){
      var add = true;
      // make sure they don't already have an attack
      for (var i = 0; i < this.playerAttacks.length; i++){
        if (this.playerAttacks.player === player){
          // repeat so replace
          this.playerAttacks[i] = {attack: dragons.attacks[this.players[player].attacks[attackNum]],
                                   target: target, player: player};
          add = false;
          break;
        }
      }
      if (add){
        // new attack so add it
        console.log("pushing", dragons.attacks[this.players[player].attacks[attackNum]]);
        this.playerAttacks.push({player: player, target: target,
                                 attack: dragons.attacks[this.players[player].attacks[attackNum]]});
      }

      if (isServer && this.playerAttacks.length === this.playerCount){
        // ready to fight
        this.fight();
      }
    };

    this.fight = function(){
      // simulate the enemy attacks
      for (var enemy in enemies){
        if (enemies.hasOwnProperty(enemy)){
          var theseAttacks = enemies[enemy].attacks;
          var attack = {};
          attack[enemies[enemy]._id] = pickAttack(theseAttacks);
          var target = this.players[randRange(0, this.players.length - 1)];
          this.enemyAttacks.push({attack: attack, target: target});
        }
      }

      // process the attacks and come up with the results
    };

    this.addPlayer = function(player){
      this.players[player._id] = player;
      this.playerCount++;
    };

  };

  if (isServer){
    module.exports = dragons.combat;
  }

  pickAttack = function(attacks){
    return attacks[randRange(0, attacks.length - 1)];
  };

  randRange = function(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  buildAttacks = function(players){
    var attacks = {};

    for (var player in players){
      if (players.hasOwnProperty(player)){
        var theseAttacks = players[player].attacks;
        for (var attack in theseAttacks){
          if (theseAttacks.hasOwnProperty(attack)){
            var thisAttack = theseAttacks[attack];
            attacks[attack] = thisAttack;
          }
        } // for attacks
      }
    } // for players
    return attacks;
  };
}());
