(function(){
  "use strict";

  var _ = require("underscore"),
      handleGet,
      handlePost, handlePut,
      handler, dispatch,

      addRoom, updateRoom,

      ControllerClass = require("../controllers/EditGame.js");

  handleGet = function(req, res, next){
    var control = new ControllerClass(req.session.user, req.params.id, req._schemas);

    var params = {};

    control.renderView(res, params);
  };

  handlePost = function(req, res, next){
    var postRoutes = {
      addRoom: addRoom
    };

    if (_.has(postRoutes, req.body.type)){
      postRoutes[req.body.type](req, res, next);
    } else {
      next(400);
    }
  };

  handlePut = function(req, res, next){
    console.log("recieved put");
    var putRoutes = {
      room: updateRoom
    };

    if (_.has(putRoutes, req.body.type)){
      putRoutes[req.body.type](req, res, next);
    } else {
      next(400);
    }
  };

  addRoom = function(req, res, next){
    if (!(_.has(req.body, "basePiece")) ||
        !(_.has(req.body, "x"))         ||
        !(_.has(req.body, "y"))){
          return next(400);
        }

    var controller = new ControllerClass(req.session.user, req.params.id, req._schemas);
    var mapPiece = {
      x: req.body.x,
      y: req.body.y,
      basePiece: req.body.basePiece
    };

    controller.addMapPiece(mapPiece, function(err, piece){
      if (err){
        res.json({error: err, msg: "database error"});
      } else {
        res.json({error: 0, piece: piece});
      }
    });
  };

  updateRoom = function(req, res, next){
    if (!_.has(req.body, "id")){
      return res.json({error: 1, msg: "Map piece _id is required"});
    }
    var controller = new ControllerClass(req.session.user, req.params.id, req._schemas);
    var mapPiece = {
      x: req.body.x || null,
      y: req.body.y || null,
      rotate: req.body.rotate || null
    };

    controller.updateMapPiece(req.body.id, mapPiece, function(err, piece){
      if (err){
        res.json({error: err, msg: "database save error"});
      } else {
        res.json({error: 0});
      }
    });
  };
  
  dispatch = {GET: handleGet, POST: handlePost, PUT: handlePut};
  handler = function(req, res, next){
    if (_.has(dispatch, req.method)){
      return dispatch[req.method](req, res, next);
    }

    return next(405);
  };
  
  module.exports = handler;
}());
