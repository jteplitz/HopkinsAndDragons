(function(){
  "use strict";

  var Routes = {
    Root: require("./Root.js"),
    Signup: require("./Signup.js"),
    Login: require("./Login.js"),
    Logout: require("./Logout.js"),
    Games: require("./Games.js"),
    EditGame: require("./EditGame.js"),
    AdminMap: require("./AdminMap.js")
  };

  // route, function, mongo, conf, auth, methods
  // auth level: -1 = guest only, 0 = not required, 1 = required
  var routeList = [
    ["/",                Routes.Root,      0, 0, 0,     ["get"                         ]],
    ["/signup",          Routes.Signup,    1, 1, -1,    ["get", "post"                 ]],
    ["/login",           Routes.Login,     1, 1, -1,    ["get", "post"                 ]],
    ["/logout",          Routes.Logout,    0, 0, 1,     ["get"                         ]],
    ["/games",           Routes.Games,     1, 0, 1,     ["get", "post"                 ]],
    ["/game/edit/:id",   Routes.EditGame,  1, 0, 1,     ["get", "post", "put", "delete"]],
    ["/admin/map",       Routes.AdminMap,  1, 1, 2,     ["get", "post"                 ]]
  ];

  exports.routes = routeList;
}());
