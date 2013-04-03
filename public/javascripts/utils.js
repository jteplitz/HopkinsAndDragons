/*globals dragons*/
(function(){
  "use strict";
 
  dragons.utils = {
    detectMouseOver: function(element, e, offset){
      var position;
      if (! (element instanceof $)){
        position = {
          left: element.x + offset.left,
          right: element.x + element.width + offset.left,
          top: element.y + offset.top,
          bottom: element.y + element.height + offset.top
        };
      } else {
        position        = element.offset();
        position.right  = position.left + element.width();
        position.bottom = position.top + element.height();
      }
      return (position.right > e.pageX &&
              position.left < e.pageX                 &&
              position.top < e.pageY                  &&
              position.bottom > e.pageY);
    }
  };
}());
