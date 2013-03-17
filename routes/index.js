(function(){
  "use strict";

  var Routes = {
    Root: require("./Root.js"),
    Signup: require("./Signup.js")
    //Login: require("./Login.js")
  };

  // route, function, mongo, conf, auth, methods
  // auth level: -1 = guest only, 0 = not required, 1 = required
  var routeList = [
    ["/",              Routes.Root, 0, 0, 0, ["get"]],
    ["/signup",        Routes.Signup, 1, 1, -1, ["get", "post"]],
    ["/login",         Routes.Login, 1, 1, -1, ["get", "post"]]
  ];

  exports.routes = routeList;
}());
