(function(){
  "use strict";

  // functions
  var openGameDialog;

  $(document).ready(function(){
    $("#newGame").click(openGameDialog);
  });

  openGameDialog = function(e){
    $("#newGameModal").modal({show: true});
  };
}());
