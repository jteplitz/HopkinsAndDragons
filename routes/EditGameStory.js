(function(){
  "use strict";

  var _ = require("underscore"),
                    handleGet,
                    handlePut,
                    handleDelete,
                    handler, dispatch,

          ControllerClass = require("../controllers/EditGameStory.js");

  handleGet = function(req, res, next){
    var control = new ControllerClass(req._schemas, req.session.user, req.params.id);

    var params = {};

    control.renderView(res, params);
  };

  handlePut = function(req, res, next){
    
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
  
  module.exports = handler;
}());
