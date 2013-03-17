(function(){
  "use strict";

  var handler;

  handler = function(conf, level){
    if (level === 0){
      return function(req, res, next){
        res.loggedIn = req.session.valid || false;
        next();
      };
    } else if (level === 1){
      return function(req, res, next){
        res.loggedIn = req.session.valid || false;
        if (!req.session.valid){
          req.session.errors = ["Sorry, please login below to do that."];
          return res.redirect("/login");
        }
        next();
      };
    }
  };

  module.exports = handler;
}());
