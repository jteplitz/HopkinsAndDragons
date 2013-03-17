(function(){
  "use strict";

  var base      = require("./base.js"),
      ViewClass = require("../views/Login.js"),
      crypto    = require("crypto"),
      _         = require("underscore");

  var LoginCtrl, _ptype;

  LoginCtrl = function(schemas, conf){
    this.schemas = schemas;
    this.conf    = conf;

    this.payload = {title: "Login"};
    this._view   = new ViewClass();
  };

  _ptype = LoginCtrl.prototype = base.getProto("std");
  _ptype._name = "Login";

  _ptype.loginUser = function(userInfo, cb){
    var self = this;
    this.schemas.User.findOne({email: userInfo.email}, function(err, user){
      if (err){ return cb(err) }

      if (_.isUndefined(user) || _.isNull(user)){
        return cb(false, {valid: false});
      }

      // generate the hash
      crypto.pbkdf2(userInfo.pass, user.salt, parseInt(self.conf.get("crypto:iterations"), 10), parseInt(self.conf.get("crypto:keylen"), 10), function(err, result){
        var encodedPassword = new Buffer(result, "binary").toString("hex");
        if (encodedPassword === user.password){
          user.valid = true;
          cb(false, user);
        } else {
          cb(false, {valid: false});
        }
      });
    });
  };

  module.exports = LoginCtrl;
}());
