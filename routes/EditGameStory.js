(function(){
  "use strict";

  var _ = require("underscore"),
                    handleGet,
                    handlePut,
                    handleDelete,
                    handler, dispatch,
                    controlCb,

          ControllerClass = require("../controllers/EditGameStory.js");

  handleGet = function(req, res, next){
    var control = new ControllerClass(req._schemas, req.session.user, req.params.id);

    var params = {};

    control.renderView(res, params);
  };

  handlePut = function(req, res, next){
    console.log("got put");
    var control = new ControllerClass(req._schemas, req.session.user, req.params.id);

    var storyPoint = {
      x   : (_.has(req.body, "x"))    ? req.body.x : null,
      y   : (_.has(req.body, "y"))    ? req.body.y : null,
      text: (_.has(req.body, "text")) ? req.body.text : null,
      enemy: (_.has(req.body, "enemy")) ? req.body.enemy : null
    };
    if (!_.has(req.body, "_id")){
      control.addPoint(storyPoint, controlCb(req, res, next));
    } else {
      control.editPoint(req.body._id, storyPoint, controlCb(req, res, next));
    }
  };

  handleDelete = function(req, res, next){
    
  };
  
  dispatch = {GET: handleGet, PUT: handlePut, DELETE: handleDelete};
  handler = function(req, res, next){
    if (_.has(dispatch, req.method)){
      return dispatch[req.method](req, res, next);
    }

    return next(405);
  };

  controlCb = function(req, res, next){
    return function(err, storyPoint){
      if (err){ return req.json(500, {error: 500, msg: "Something went wrong while saving the story point"}) }
      
      res.json({
        error: 0
      });
    };
  };
  
  module.exports = handler;
}());
