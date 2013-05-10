(function(){
  "use strict";

  var Routes = {
    Root: require("./Root.js"),
    Signup: require("./Signup.js"),
    Login: require("./Login.js"),
    Logout: require("./Logout.js"),
    Games: require("./Games.js"),
    EditGame: require("./EditGame.js"),
    AdminMap: require("./AdminMap.js"),
    AdminEnemy: require("./AdminEnemy.js"),
    AdminEnemies: require("./AdminEnemies.js"),
    EditGameEnemies: require("./EditGameEnemies.js"),
    Game: require("./Game.js"),
    EditGameStory: require("./EditGameStory.js"),
    EditGamePlayers: require("./EditGamePlayers.js")
  };

  // route, function, mongo, conf, auth, methods
  // auth level: -1 = guest only, 0 = not required, 1 = required
  var routeList = [
    ["/",                       Routes.Root,              0, 0, 0,    ["get"                         ]],
    ["/signup",                 Routes.Signup,            1, 1, -1,   ["get", "post"                 ]],
    ["/login",                  Routes.Login,             1, 1, -1,   ["get", "post"                 ]],
    ["/logout",                 Routes.Logout,            0, 0, 1,    ["get"                         ]],
    ["/games",                  Routes.Games,             1, 0, 1,    ["get", "post"                 ]],
    ["/game/:id/edit/map",      Routes.EditGame,          1, 0, 1,    ["get", "post", "put", "delete"]],
    ["/game/:id/edit/enemies",  Routes.EditGameEnemies,   1, 0, 1,    ["get", "post", "put", "delete"]],
    ["/game/:id/edit/story",    Routes.EditGameStory,     1, 0, 1,    ["get",         "put", "delete"]],
    ["/game/:id/edit/players",  Routes.EditGamePlayers,   1, 1, 1,    ["get", "post"                 ]],
    ["/game/:id",               Routes.Game,              1, 1, 1,    ["get"                         ]],
    ["/admin/map",              Routes.AdminMap,          1, 1, 2,    ["get", "post"                 ]],
    ["/admin/enemy/:id?",       Routes.AdminEnemy,        1, 1, 2,    ["get", "post"                 ]],
    ["/admin/enemies",          Routes.AdminEnemies,      1, 1, 2,    ["get"                         ]]
  ];

  exports.routes = routeList;
}());
