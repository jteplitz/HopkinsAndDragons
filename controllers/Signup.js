(function(){
  "use strict";

  var base = require("./base.js"),
      crypto = require("crypto"),
      async  = require("async"),
      monotonic = require("../app/monotonic.js"),
      ViewClass = require("../views/Signup.js"),

      SignupCtrl, _ptype,

      // functions
      setupUser, generateSalt;

  SignupCtrl = function(schemas, conf){
    this.schemas = schemas;
    this.conf    = conf;

    this.payload = {title: "Signup"};
    this._view   = new ViewClass();
  };

  _ptype = SignupCtrl.prototype = base.getProto("std");
  _ptype._name = "Signup";

  _ptype.createUser = function(userData, cb){
    var self = this;
    async.parallel([
        function(cb){ setupUser(self, userData, cb) },
        function(cb){ monotonic.getSequence("users", self.conf, cb) }
      ],
      function(err, data){
        if (err){ return cb(err) }

        console.log("saving with id", data[1]);
        var user = new self.schemas.User({
          firstName: userData.firstName,
          lastName: userData.lastName,
          salt: data[0].salt,
          password: data[0].pass,
          _id: data[1][0]
        });
        
        user.save(cb);
     });
  };

  setupUser = function(self, userData, cb){
    // generate a salt
    generateSalt(function(err, salt){
      console.log("generated salt");
      if (err){ return cb(err) }

      // hash the password
      crypto.pbkdf2(userData.password, salt, parseInt(self.conf.get("crypto:iterations"), 10), parseInt(self.conf.get("crypto:keylen"), 10), function(err, result){
        console.log("hashed pass");
        if (err){ return cb(err) }

        cb(false, {salt: salt, pass: new Buffer(result, "binary").toString("hex")});
      });
    });
  };

  generateSalt = function(cb){
    crypto.randomBytes(32, function(err, salt){
      if (err){
        return cb(err);
      }

      cb(false, new Buffer(salt, "binary").toString("hex"));
    });
  };

  module.exports = SignupCtrl;
}());
