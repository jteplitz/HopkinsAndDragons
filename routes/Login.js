(function(){
  "use strict";

  var _ = require("underscore"),

          handleGet, handlePost,
          handler, dispatch,

          ControllerClass = require("../controllers/Login.js");

  handlePost = function(req, res, next){
    var control = new ControllerClass(req._schemas, req._conf);

    var loginInfo = {
      email: req.body.email,
      pass: req.body.password
    };

    control.loginUser(loginInfo, function(err, user){
      if (err){
        console.log("error logging in user");
        return next(500);
      }

      if (!user.valid){
        req.session.errors = ["Incorrect email / password combination"];
        return res.redirect("/login");
      }

      req.session.valid = true;
      req.session.user  = user;

      res.redirect("/games");
    });
  };


  handleGet = function(req, res, next){
    var control = new ControllerClass();

    var params = {};

    control.renderView(res, params);
  };

  dispatch = {GET: handleGet, POST: handlePost};
  handler = function(req, res, next){
    if (_.has(dispatch, req.method)){
      return dispatch[req.method](req, res, next);
    }

    return next(405);
  };
  
  module.exports = handler;
}());
