(function(){
  "use strict";

  var _ = require("underscore"),
                    handleGet,
                    handlePost,
                    handler, dispatch,

          ControllerClass = require("../controllers/EditGamePlayers.js");

  handleGet = function(req, res, next){
    var control = new ControllerClass(req._schemas, req.session.user, req.params.id);
    var params = {};

    control.renderView(res, params);
  };

  handlePost = function(req, res, next){
    var control = new ControllerClass(req._schemas, req.session.user, req.params.id);
    var players = {
      Rogue: req.body.rogue,
      Sorcerer: req.body.Sorcerer,
      Tinkerer: req.body.Tinkerer,
      Knight: req.body.Knight
    };
    control.changePlayers(players, function(err){
      if (err){
        return next(err);
      }
      control.renderView(res, {});
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
