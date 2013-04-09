(function(){
  "use strict";

  var _ = require("underscore"),
                    handleGet,
                    handler, dispatch,

      ControllerClass = require("../controllers/AdminEnemies.js");

  handleGet = function(req, res, next){
    var control = new ControllerClass(req._schemas, req._conf);

    var params = {};

    control.renderView(res, params);
  };
  
  dispatch = {GET: handleGet};
  handler = function(req, res, next){
    if (_.has(dispatch, req.method)){
      return dispatch[req.method](req, res, next);
    }

    return next(405);
  };
  
  module.exports = handler;
}());
