(function(){
  "use strict";

  var _ = require("underscore"),
      handleGet,
      handlePost,
      handler, dispatch,

      ControllerClass = require("../controllers/AdminEnemies.js");

  handleGet = function(req, res, next){
    var control = new ControllerClass(req._schemas, req._conf);

    var params = {};

    control.renderView(res, params);
  };

  handlePost = function(req, res, next){
    var control = new ControllerClass(req._schemas, req._conf);
    
    var enemyData = {
      name: req.body.name,
      type: req.body.type,
      level: req.body.level,
      armor: req.body.armor,
      health: req.body.health,
      image: req.body.image
    };
    control.addEnemy(enemyData, JSON.parse(req.body.attacks), function(err, enemy){
      if (err){
        console.log("db error", err);
        return next(500);
      }

      res.redirect("/admin/enemies");
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
