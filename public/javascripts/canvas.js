var isServer = (typeof _ === "undefined");
var dragons  = (dragons instanceof Object) ? dragons : {};
var _        = (_ instanceof Object)       ? _       : require("underscore");
var $        = ($ instanceof Object) ? $ : {};

(function(){
  "use strict";

  if (isServer){
    dragons.utils = require("./utils.js");
  }

  dragons.canvas = function(canvas, conf){
    var canvasWidth, canvasHeight;
    if (!isServer){
      this.canvasElement = canvas;
      this.ctx           = canvas.getContext("2d");
      canvasWidth        = $(this.canvasElement).width();
      canvasHeight       = $(this.canvasElement).height();
    } else {
      dragons.utils.setupConf(conf);
      dragons.globals    = conf.get("gameGlobals");
      dragons.utils.cleanGlobals();
      canvasWidth        = canvas.width;
      canvasHeight       = canvas.height;
    }
    this.elements      = [];


    this.update = function(){
      for (var i = 0; i < this.elements.length; i++){
        this.elements[i].update();
      }
    };

    this.draw = function(){
      this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      for (var i = 0; i < this.elements.length; i++){
        this.elements[i].draw(this.ctx);
      }
    };

    this.addElement = function(element){
      if (_.isArray(element)){
        this.elements = this.elements.concat(element);
      } else {
        if (element instanceof dragons.RoomElement){
          this.elements.unshift(element);
        } else {
          this.elements.push(element);
        }
      }
    };
  };

  dragons.gameElements = {
    element: function(width, height, x, y, id){
      this.width     = width;
      this.height    = height;
      this.x         = x;
      this.y         = y;
      this.dx        = 0;
      this.dy        = 0;
      this._id       = id;
      this.outOfSync = false;

      this.update = function(){
        this.x += this.dx;
        this.y += this.dy;
      };
    },

    image: function(image, width, height, x, y, rotate, id){
      dragons.gameElements.element.call(this, width, height, x, y, id);
      this.image = image;
      this.rotate = (!_.isUndefined(rotate)) ? rotate : 0;

      this.draw = function(ctx){
        ctx.save();

        ctx.translate(this.x + (this.width / 2), this.y + (this.height / 2));
        ctx.rotate(this.rotate *  (Math.PI / 2));
        ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);

        ctx.restore();
      };
    },
    colorBlock: function(color, width, height, x, y){ // a rectangle of a color
      dragons.gameElements.element.call(this, width, height, x, y, null);
      this.color = color;

      this.draw = function(ctx){
        ctx.save();

        ctx.globalAlpha = 0.7;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.restore();
      };
    },
    Enemy: function(image, width, height, x, y, pullRadius, id){
      dragons.gameElements.element.call(this, width, height, x, y, id);

      this.pullRadius = pullRadius;
      this.image      = new dragons.gameElements.image(image, width, height, x, y, 0, id);

      this.draw = function(ctx){
        this.image.draw(ctx);
      };
    },
    Player: function(image, width, height, x, y, name, id){
      dragons.gameElements.image.call(this, image, width, height, x, y, 0, id);

      this.name = name;
      this.inputs = [];
      this.lastRecievedInput = 0;
      this.lastHandledInput  = 0;

      this.update = function(){
        var dx = 0, dy = 0;
        
        for (var i = 0; i < this.inputs.length; i++){
          if (this.inputs[i].seq <= this.lastHandledInput){
            continue; // we've already moved him this much. TODO: remove inputs after server handling
          }
          
          var input = this.inputs[i].inputs;

          // loop through each input in the sequence
          for (var j = 0; j < input.length; j++){
            switch (input[j]){
              case "l":
                dx -= 1;
                break;
              case "r":
                dx += 1;
                break;
              case "u":
                dy -= 1;
                break;
              case "d":
                dy += 1;
                break;
            }
          }
        }

      // now apply the movement
      if (this.inputs.length > 0 && this.lastHandledInput < this.inputs[this.inputs.length - 1].seq){
        // update the lastHandledInput
        this.lastHandledInput = this.inputs[this.inputs.length - 1].seq;
      }
      var movement = dragons.createMovementVector(dx, dy);
      this.x += movement.x;
      this.y += movement.y;
    };
  }
};

dragons.RoomElement = function(image, width, height, x, y, rotate, doorLeft, doorRight, doorTop, doorBottom, id){
  dragons.gameElements.image.call(this, image, width, height, x, y, rotate, id);

  this.doorLeft   = doorLeft;
  this.doorRight  = doorRight;
  this.doorTop    = doorTop;
  this.doorBottom = doorBottom;
};

dragons.createMovementVector = function(dx, dy){
  //Must be fixed step, at physics sync speed.
  return {
      x : (dx * (dragons.globals.playerSpeed * 0.015)),
      y : (dy * (dragons.globals.playerSpeed * 0.015))
  };
};
if (isServer){
  module.exports = dragons;
}
}());
