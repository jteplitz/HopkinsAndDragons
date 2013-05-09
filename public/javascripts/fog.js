var isServer = (typeof _ === "undefined");
var dragons  = (dragons instanceof Object) ? dragons : {};
(function(){
  "use strict";

  if (isServer){
    dragons.utils = require("./utils.js");
  }

  dragons.fogCanvas = function(canvas, width, height, sight){
    this.canvas = canvas;
    this.ctx    = canvas.getContext("2d");
    this.width  = width;
    this.height = height;
    this.sight  = sight;

    this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.fillStyle = "rgba(200, 200, 200, 1)";

    this.loadFromSave = function(image){
      this.ctx.clearRect(0, 0, width, height);
      this.ctx.drawImage(image, 0, 0, this.width, this.height);
    };

    this.updateFog = function(player){
      for (var i = 0; i < player.movements.length; i++){
        var movement  = player.movements[i];
        this.ctx.beginPath();
        this.ctx.globalCompositeOperation = "destination-out";
        this.ctx.arc(movement.x, movement.y, this.sight, 0, 2 * Math.PI, false);
        this.ctx.fill();
      }
      player.movements.splice(0);
    };

    this.outputPng = function(){
      return this.canvas.toDataURL("image/png");
    };
  };

  if (isServer){
    module.exports = dragons;
  }
}());
