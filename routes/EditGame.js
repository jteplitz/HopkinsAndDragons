(function(){
  "use strict";

  var _ = require("underscore"),
      handleGet,
      handlePost, handlePut, handleDelete,
      handler, dispatch,

      addRoom, updateRoom, deleteRoom,

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
    var required = ["basePiece", "x", "y", "rotate"];
    for (var i = 0; i < required.length; i++){
      if (!_.has(req.body, required[i])){
        return res.json(400, {error: 400, msg: required[i] + " is required"});
      }
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
      rotate: req.body.rotate || null,
      doorLeft: (req.body.doorLeft === "true"),
      doorRight: (req.body.doorRight === "true"),
      doorTop: (req.body.doorTop === "true"),
      doorBottom: (req.body.doorBottom === "true")
    };

    controller.updateMapPiece(req.body.id, mapPiece, function(err, piece){
      if (err){
        res.json({error: err, msg: "database save error"});
      } else {
        res.json({error: 0});
      }
    });
  };

  handleDelete = function(req, res, next){
    var deleteRoutes = {
      room: deleteRoom
    };

    if (_.has(deleteRoutes, req.body.type)){
      deleteRoutes[req.body.type](req, res, next);
    } else {
      next(400);
    }
  };

  deleteRoom = function(req, res, next){
    var controller = new ControllerClass(req.session.user, req.params.id, req._schemas);
    controller.deleteMapPiece(req.body.id, function(err){
      if (err){
        console.log("database save error", err);
        res.json({error: err, msg: "database save error"});
      } else {
        res.json({error: 0});
      }
    });
  };
  
  dispatch = {GET: handleGet, POST: handlePost, PUT: handlePut, DELETE: handleDelete};
  handler = function(req, res, next){
    if (_.has(dispatch, req.method)){
      return dispatch[req.method](req, res, next);
    }

    return next(405);
  };
  
  module.exports = handler;
}());
