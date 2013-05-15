var isServer = (typeof _ === "undefined");
var dragons  = (dragons instanceof Object) ? dragons : {};
var _        = (_ instanceof Object)       ? _       : require("underscore");
var $        = ($ instanceof Object) ? $ : {};

(function(){
  "use strict";

  var buildAttacks, pickAttack, randRange, generatePlayerList, emptyObject;

  dragons.combat = function(enemies, players, yourID, conf){
    this.enemies = {};
    this.players = {};
    this.roomId  = null;
    this.playerCount = 0;

    this.playerAttacks = [];
    this.enemyAttacks  = [];

    this.enemies = enemies;
    this.players = players;
    this.state   = null;

    // count the players
    for (var player in this.players){
      if (this.players.hasOwnProperty(player)){
        this.players[player].health = 50;
        this.playerCount++;
      }
    }

    // setup the enemeis
    for (var enemy in this.enemies){
      if (this.enemies.hasOwnProperty(enemy)){
        var thisEnemy = this.enemies[enemy];
        thisEnemy.health = thisEnemy.gameData.baseEnemy.health;
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
        if (this.playerAttacks[i].player === player){
          // repeat so replace
          this.playerAttacks[i] = {attack: dragons.attacks[this.players[player].attacks[attackNum]],
                                   name: this.players[player].attacks[attackNum],
                                   target: target, player: player};
          add = false;
          break;
        }
      }
      if (add){
        // new attack so add it
        this.playerAttacks.push({player: player, target: target,
                                 name: this.players[player].attacks[attackNum],
                                 attack: dragons.attacks[this.players[player].attacks[attackNum]]});
      }

      console.log("attack", add, this.playerAttacks.length, this.playerCount);

      if (isServer && this.playerAttacks.length === this.playerCount){
        // ready to fight
        return this.fight();
      } else {
        return null;
      }
    };

    this.fight = function(){
      var playerList = generatePlayerList(this.players), messages = [], i, damage;
      // simulate the enemy attacks
      for (var enemy in this.enemies){
        if (this.enemies.hasOwnProperty(enemy)){
          var theseAttacks = this.enemies[enemy].gameData.baseEnemy.attacks;
          var attack = null;
          attack = pickAttack(theseAttacks);
          var target = playerList[randRange(0, playerList.length - 1)];
          this.enemyAttacks.push({attack: attack, enemy: this.enemies[enemy], target: target});
        }
      }

      // process the attacks and come up with the results
      
      // players first
      for (i = 0; i < this.playerAttacks.length; i++){
        var castMsg = this.players[this.playerAttacks[i].player].name + " casts " +
                      this.playerAttacks[i].name + " at " +
                      this.enemies[this.playerAttacks[i].target].gameData.baseEnemy.name;
        // check for hit
        if (Math.random() < parseFloat(this.playerAttacks[i].attack.hit)){
          // hit
          damage = randRange(this.playerAttacks[i].attack.minDamage, this.playerAttacks[i].attack.maxDamage);
          this.enemies[this.playerAttacks[i].target].health -= damage;
          castMsg += ". It hits dealing " + damage + " damage.";
          var enemyHealth = {};
          enemyHealth[this.playerAttacks[i].target] = this.enemies[this.playerAttacks[i].target].health;
          messages.push({
            msg: castMsg,
            enemyHealth: enemyHealth
          });
          if (this.enemies[this.playerAttacks[i].target].health <= 0){
            messages.push({msg: "You have defeated " + this.enemies[this.playerAttacks[i].target].gameData.baseEnemy.name + "."});
            delete this.enemies[this.playerAttacks[i].target];
          }
        } else {
          // not a hit
          messages.push({msg: castMsg + ". It misses."});
        }
      }

      // now the enemies
      for (i = 0; i < this.enemyAttacks.length; i++){
        var thisAttack = this.enemyAttacks[i];
        var enemyMsg = thisAttack.enemy.gameData.baseEnemy.name + " " + thisAttack.attack.name + " " + this.players[thisAttack.target].name;
        
        // check for hit
        if (Math.random() < (thisAttack.attack.hitChance / 100)){
          damage = randRange(thisAttack.attack.minDamage, thisAttack.attack.maxDamage);
          this.players[thisAttack.target].health -= damage;
          enemyMsg += ". It hits dealing " + damage + " damage.";

          var playerHealth = {};
          playerHealth[thisAttack.target] = this.players[thisAttack.target].health;
          messages.push({
            msg: enemyMsg,
            playerHealth: playerHealth
          });
          if (this.players[thisAttack.target].health <= 0){
            messages.push({msg: this.players[thisAttack.target].name + " has been defeated."});
          }
        } else {
          // not a hit
          messages.push({msg: enemyMsg + ". It misses."});
        }
      }
      
      // remove the attacks that we just simulated
      this.playerAttacks.splice(0);
      this.enemyAttacks.splice(0);
      return messages;
    };

    // refresh the combat UI
    this.refresh = function(){
      // TODO: reset all health bars

      // reset the big health bar
      var health_percent = (this.players[this.player].health / 50) * 100;
      $("#combatModal .healthMeter").animate({"width": health_percent + "%"}, 100);
    };

    // resets combat UI to move to next round
    this.reset = function(){
      $("#combatModal .selected").removeClass("selected");
      $("#combatModal .messages").text("Select an attack.");
      this.state = "attack";
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

  generatePlayerList = function(players){
    var list = [];
    for (var player in players){
      if (players.hasOwnProperty(player)){
        list.push(player);
      }
    }
    return list;
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
