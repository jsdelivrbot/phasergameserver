const playerManager = require("../modules/players/PlayerManager");

module.exports = function createServer(server) {
	const io = require("socket.io")(server);

	io.on("connection", socket => {
		socket.on("login", ({ name }, callback) => {
			playerManager.login(name, socket, (loginMessage, player) => {
				callback(loginMessage);
			});
		});
		socket.on("adminLogin", (data, callback) => {
			//login and see if he is an admin
			playerManager.adminLogin(
				data.email,
				data.password,
				socket,
				(loginMessage, admin) => {
					callback(loginMessage);
				},
			);
		});
	});

	// map objects
	const mapObjects = require("../modules/MapObjectManager");
	mapObjects.events.on("objectCreate", data => io.emit("objectCreate", data));
	mapObjects.events.on("objectChange", data => io.emit("objectChange", data));
	mapObjects.events.on("objectDelete", data => io.emit("objectDelete", data));

	// maps
	const mapManager = require("../modules/maps/MapManager");
	mapManager.events.on("mapsChange", data => io.emit("mapsChange", data));
	mapManager.events.on("tilesChange", data => io.emit("tilesChange", data));
	mapManager.events.on("layersChange", data => io.emit("updateLayers", data));
	mapManager.events.on("tilePropertiesChange", data =>
		io.emit("tilePropertiesChange", data),
	);

	// template events
	const templates = require("../modules/templates");
	templates.events.on("templateChange", data =>
		io.emit("templateChange", data),
	);
	templates.events.on("templateCreate", data =>
		io.emit("templateCreate", data),
	);
	templates.events.on("templateDelete", data =>
		io.emit("templateDelete", data),
	);
};
