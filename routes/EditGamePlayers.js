(function(){
  "use strict";

  var _ = require("underscore"),
                    handleGet,
                    handlePost,
                    handler, dispatch,

          ControllerClass = require("../controllers/EditGamePlayers.js");

  handleGet = function(req, res, next){
    var control = new ControllerClass(req._schemas, req._conf, req.session.user, req.params.id);
    var params = {};

    control.renderView(res, params);
  };

  handlePost = function(req, res, next){
    var control = new ControllerClass(req._schemas, req._conf, req.session.user, req.params.id);
    var players = {
      Rogue: (_.has(req.body, "Rogue") && req.body.Rogue !== "") ? req.body.Rogue : null,
      Sorcerer: (_.has(req.body, "Sorcerer") && req.body.Sorcerer !== "") ? req.body.Sorcerer : null,
      Tinkerer: (_.has(req.body, "Tinkerer") && req.body.Tinkerer !== "") ? req.body.Tinkerer : null,
      Knight: (_.has(req.body, "Knight") && req.body.Knight !== "") ? req.body.Knight : null
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
