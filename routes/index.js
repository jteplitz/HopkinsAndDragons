(function(){
  "use strict";

  var Routes = {
    Root: require("./Root.js")
  };

  // route, function, mongo, conf, auth, methods
  // auth level: 0 = not required, 1 = required
  var routeList = [
    ["/",              Routes.Root, 0, 0, 0, ["get"]]
  ];

  exports.routes = routeList;
}());
