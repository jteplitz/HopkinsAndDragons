(function(){
  "use strict";

  var base = require("./base.js"),
      ViewClass = require("../views/Root.js");

  var RootCtrl, _ptype;

  RootCtrl = function(){
    this.payload = {title: "Hopkins and Dragons"};
    this._view   = new ViewClass();
  };

  _ptype = RootCtrl.prototype = base.getProto("std");
  _ptype._name = "Root";

  module.exports = RootCtrl;
}());
