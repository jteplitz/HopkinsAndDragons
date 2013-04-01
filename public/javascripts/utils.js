/*globals dragons*/
(function(){
  "use strict";
 
  dragons.utils = {
    detectMouseOver: function(element, e){
      var position = element.offset();
      return (position.left + element.width() > e.pageX &&
              position.left < e.pageX                 &&
              position.top < e.pageY                  &&
              position.top + element.height());
    }
  };
}());
