const players = require("../modules/players");
const io = require("socket.io")(8181);

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

// map objects
const mapObjects = require("../modules/objectController");
mapObjects.events.on("objectCreate", data => io.emit("objectCreate", data));
mapObjects.events.on("objectChange", data => io.emit("objectChange", data));
mapObjects.events.on("objectDelete", data => io.emit("objectDelete", data));

// maps
const maps = require("../modules/maps");
maps.events.on("mapsChange", data => io.emit("mapsChange", data));
maps.events.on("tilesChange", data => io.emit("tilesChange", data));
maps.events.on("layersChange", data => io.emit("updateLayers", data));
maps.events.on("tilePropertiesChange", data =>
	io.emit("tilePropertiesChange", data)
);

// template events
const templates = require("../modules/templates");
templates.events.on("templateChange", data => io.emit("templateChange", data));
templates.events.on("templateCreate", data => io.emit("templateCreate", data));
templates.events.on("templateDelete", data => io.emit("templateDelete", data));
