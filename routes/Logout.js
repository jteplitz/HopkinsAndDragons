(function(){
  "use strict";

  var handleGet,
      dispatch, handler,

      _ = require("underscore");

  handleGet = function(req, res, next){
    req.session.destroy(function(){
      res.redirect("/");
    });
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
