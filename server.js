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
var cmds = require("./modules/cmds.js");

//load the dataFiles
dataFiles.load(init);

function init() {
	dataServer.init();
	players.init();
	maps.init();
	commands.init();
	cmds.console();
	objectController.init();

	io = require("socket.io")(8181);
	io.on("connection", function(socket) {
		socket.on("login", function(data, callback) {
			players.login(data.email, data.password, socket, function(
				loginMessage,
				_player
			) {
				callback(loginMessage);
			});
		});
		socket.on("adminLogin", function(data, callback) {
			//login and see if he is an admin
			players.adminLogin(data.email, data.password, socket, function(
				loginMessage,
				_admin
			) {
				callback(loginMessage);
			});
		});
	});

	console.timeLog("Server started, type " + "help".info + " or " + "?".info);
}
