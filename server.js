// libraries
require("./modules/functions.js");
var colors = require("colors");

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

//set the log colors
colors.setTheme({
	success: "green", //[33m
	info: "cyan", //[36m
	warn: "yellow", //[33m
	error: "red" //[31m
});

//load the dataFiles
dataFiles.load(init);

function init() {
	dataServer.init();
	players.init();
	maps.init();
	commands.init();
	cmds.console();
	chat.init();
	objectController.init();
	templates.init();

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

//log
console._log_ = console.log;
console.log = function() {
	console._log_.apply(console, arguments);
	chat.message(
		"Server",
		{
			message: Array.prototype.join.call(arguments, "")
		},
		true
	);
};
console.__proto__.timeLog = function() {
	var args = Array.prototype.slice.call(arguments);
	d = new Date();
	args.splice(
		0,
		0,
		"[" + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + "]"
	);
	console.log.apply(console, args);
};
