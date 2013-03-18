(function(){
  "use strict";
  var http = require("./http");

  exports.getSequence = function(name, conf, cb){
    var path = "/a/" + conf.get("monotonic:email") + "/" + name;
    console.log("path", path);
    http.request({
      scheme: "https",
      hostname: conf.get("monotonic:url"),
      path: path,
      method: "POST"
    }, {auth: conf.get("monotonic:password")}, "json", function(err, data){
      if (err){ cb(err) }

      cb(false, data.result);
    });
  };
}());
