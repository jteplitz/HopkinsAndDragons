(function(){
  "use strict";

  var _ = require("underscore"),
          handleGet,handlePost,
          handler, dispatch,
          ControllerClass = require("../controllers/Games.js");
  
  handleGet = function(req, res, next){
    var control = new ControllerClass(req._schemas, req.session.user);

    var params = {};

    control.renderView(res, params);
  };
  
  handlePost = function(req, res, next){
    var control = new ControllerClass(req._schemas, req.session.user);
    var game = {
      name: req.body.name
    };
    control.createGame(game, function(err, game){
      if (err){
        console.log("error creating game", err);
        return next(500);
      }

      res.redirect("/game/" + game._id + "/edit/map");
    });
  };
  

  dispatch = {GET: handleGet,POST: handlePost};
  handler = function(req, res, next){
    if (_.has(dispatch, req.method)){
      return dispatch[req.method](req, res, next);
    }

    return next(405);
  };
  
  module.exports = handler;
}());
