/*globals dragons*/
(function(){
  "use strict";

  dragons.fogCanvas = function(canvas, width, height){
    this.ctx    = canvas.getContext("2d");
    this.width  = width;
    this.height = height;
    this.sight  = dragons.globals.playerSight;

    this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.fillStyle = "rgba(200, 200, 200, 1)";

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
  };
}());
