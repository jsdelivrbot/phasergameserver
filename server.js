// libraries
require("./modules/functions.js");

var Admin = require("./modules/admin.js");
var maps = require("./modules/maps.js");
var players = require("./modules/players.js");
var chat = require("./modules/chat.js");
var dataServer = require("./modules/dataServer.js");
var db = require("./modules/db.js");
var dataFiles = require("./modules/dataFiles.js");
// var resources = require('./modules/resources.js');
var commands = require("./modules/commands.js");
var objectController = require("./modules/objectController.js");
var templates = require("./modules/templates.js");

//load the dataFiles
dataFiles.load(init);

function init() {
	dataServer.init();
	players.init();
	maps.init();
}
