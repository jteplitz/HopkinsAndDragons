/*globals dragons _*/
(function(){
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
        this.elements.push(element);
      }
    };
  };

  dragons.gameElements = {
    element: function(width, height, x, y){
      this.width   = width;
      this.height  = height;
      this.x       = x;
      this.y       = y;
      this.dx      = 0;
      this.dy      = 0;

      this.update = function(){
        this.x += this.dx;
        this.y += this.dy;
      };
    },

    image: function(image, width, height, x, y){
      dragons.gameElements.element.call(this, width, height, x, y);
      this.image = image;

      this.draw = function(ctx){
        ctx.drawImage(this.image, this.x, this.y);
      };
    }
  };

}());
