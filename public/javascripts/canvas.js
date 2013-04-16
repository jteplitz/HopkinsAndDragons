/*globals dragons _*/ (function(){
  "use strict";

  dragons.canvas = function(canvas){
    this.canvasElement = canvas;
    this.ctx           = canvas.getContext("2d");
    this.elements      = [];

    var canvasWidth  = $(this.canvasElement).width(), canvasHeight = $(this.canvasElement).height();

    this.update = function(){
      this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      for (var i = 0; i < this.elements.length; i++){
        this.elements[i].update();
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
    }
  };

  dragons.RoomElement = function(image, width, height, x, y, rotate, doorLeft, doorRight, doorTop, doorBottom, id){
    dragons.gameElements.image.call(this, image, width, height, x, y, rotate, id);

    this.doorLeft   = doorLeft;
    this.doorRight  = doorRight;
    this.doorTop    = doorTop;
    this.doorBottom = doorBottom;
  };
}());
