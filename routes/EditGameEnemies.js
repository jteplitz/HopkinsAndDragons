(function(){
  "use strict";

  var _ = require("underscore"),
                    handleGet,
                    handlePost,
                    handlePut,
                    handleDelete,
                    handler, dispatch,

          ControllerClass = require("../controllers/EditGameEnemies.js");

  handleGet = function(req, res, next){
    var control = new ControllerClass(req.session.user, req.params.id, req._schemas);

    var params = {};
    control.renderView(res, params);
  };

  handlePost = function(req, res, next){
    
  };

  handlePut = function(req, res, next){
    
  };

  handleDelete = function(req, res, next){
    
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
