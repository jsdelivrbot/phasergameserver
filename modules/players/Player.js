const chatManager = require("../chat/ChatManager");
const mapManager = require("../maps/MapManager");
const mapObjectManager = require("../MapObjectManager");
const db = require("../db");

function Player(userData, socket) {
	//dont set socket.id because its already used
	socket.userData = userData; //dont use this as active data
	socket.lastPlayersArray = [];

	socket.userID = userData.id;
	socket.health = userData.health;
	socket.position = {
		x: userData.x || -1, //a position of -1 is interpreted as maps spawn
		y: userData.y || -1,
		map: userData.map || 0,
	};
	socket.inventory = userData.inventory || [];

	socket.on("disconnect", () => {
		chatManager.leaveAll(socket);
		socket.exit();
	});

	socket.on("updatePosition", data => {
		socket.move(data.x, data.y, data.map);
	});

	socket.on("getLayers", cb => {
		cb(mapManager.layers);
	});

	socket.on("getChunk", (data, cb) => {
		let chunk = mapManager.getChunk(data.x, data.y, data.map);

		if (cb) cb(chunk.exportData());
	});

	//objects
	socket.on("getObject", (data, cb) => {
		let obj = mapObjectManager.getObject(data.id, data.type);
		if (cb) cb(obj.exportData());
	});
	socket.on("getObjects", ({ type, from, to }, cb) => {
		let objects = mapObjectManager.getObjectsOnPosition(type, from, to);
		if (cb) cb(objects.map(o => o.exportData()));
	});
	socket.on("objectCreate", (data, cb) => {
		let object = mapObjectManager.createObject(data.type, data.data);
		if (cb) cb(object.exportData());
	});
	socket.on("objectChange", (data, cb) => {
		// data is a array of changed objs
		mapObjectManager.updateObject(data.id, data.type, data);
		if (cb) cb(true);
	});
	socket.on("objectDelete", ({ id, type }, cb) => {
		mapObjectManager.deleteObject(id, type);
		if (cb) cb(true);
	});

	//chat
	if (socket.userData.admin) chatManager.join("Server", socket);
	chatManager.joinDefault(socket);
	socket.on("chatChanelMessage", ({ chanel, message }) => {
		chatManager.message(chanel, message);
	});
	socket.on("chatChanelLeave", ({ chanel }) => {
		chatManager.leave(chanel, socket);
	});

	socket.update = () => {
		const playerManager = require("./PlayerManager");

		//send all the players down
		let players = [];
		for (let i = 0; i < playerManager.players.length; i++) {
			let player = playerManager.players[i];
			if (player.position.map === socket.position.map && player !== socket) {
				players.push({
					id: player.userID,
					name: player.userData.name,
					x: player.position.x,
					y: player.position.y,
					health: socket.health,
				});
			}
		}

		//see if there is a difference
		// let diff = fn.getDiff(socket.lastPlayersArray, players);
		// if (!fn.isEmptyDiff(diff)) {
		socket.lastPlayersArray = players;
		socket.emit("updatePlayers", players);
		// }
	};
	socket.exportData = () => {
		//exports data in db format
		return {
			...socket.userData,
			x: socket.position.x,
			y: socket.position.y,
			map: socket.position.map,
			inventory: socket.inventory,
		};
	};
	socket.move = (x, y, map) => {
		//update the players location
		socket.position.x = x !== undefined ? x : socket.position.x;
		socket.position.y = y !== undefined ? y : socket.position.y;
		socket.position.map = map !== undefined ? map : socket.position.map;
	};
	socket.save = cb => {
		const playerManager = require("./PlayerManager");

		playerManager.savePlayer(socket.userID, cb);
	};
	socket.exit = () => {
		const playerManager = require("./PlayerManager");

		socket.save();
		playerManager.removePlayer(socket.userID);
	};

	//send the maps first
	socket.emit("mapsChange", mapManager.getMapList());
	socket.emit("tilePropertiesChange", mapManager.tileProperties);

	//send userData
	socket.emit("userData", socket.userData);

	//bind error events
	socket.on("logError", err => {
		db.errors.save({
			...err,
			id: db.errors.count(),
			app: "game",
		});
	});

	return socket;
}

//export
module.exports = Player;
