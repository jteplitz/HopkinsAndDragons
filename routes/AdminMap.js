(function(){
  "use strict";

  var _  = require("underscore"),
      fs = require("fs"),
                    handleGet,
                    handlePost,
                    handler, dispatch,

          ControllerClass = require("../controllers/AdminMap.js");

  handleGet = function(req, res, next){
    var control = new ControllerClass(req._schemas, req._conf);

    var params = {messages: req.session.messages};

    control.renderView(res, params);
  };

  handlePost = function(req, res, next){
    var control = new ControllerClass(req._schemas, req._conf);
    var pieceInfo = {
      image: fs.readFileSync(__dirname + '/../public/upload/' + req.files.mapFile.path.replace(/^.*[\\\/]/, '')),
      doorLeft: _.has(req.body, "doorLeft"),
      doorRight: _.has(req.body, "doorRight"),
      doorTop: _.has(req.body, "doorTop"),
      doorBottom: _.has(req.body, "doorBottom")
    };

    control.addPiece(pieceInfo, function(err, piece){
      if (err){ return next(err) }
      console.log("saved", err, piece);

      req.session.messages = ["Added piece"];

      res.redirect("/admin/map");
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
