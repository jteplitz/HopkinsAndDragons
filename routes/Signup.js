(function(){
  "use strict";

  var _ = require("underscore"),

      handleGet, handlePost,
      handler, dispatch,

      ControllerClass = require("../controllers/Signup.js");

  handleGet = function(req, res, next){
    var control = new ControllerClass();

    var params = {};

    control.renderView(res, params);
  };

  handlePost = function(req, res, next){
    var control = new ControllerClass(req._schemas, req._conf);

    var user = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password
    };

    control.createUser(user, function(err, user){
      console.log("user created", user);
      if (err){
        console.log("Error creating user", err);
        return next(500);
      }

      req.session.loggedIn = true;
      req.session.user     = user;
      res.redirect("/games");
    });
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
