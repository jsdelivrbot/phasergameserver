const { mapManager } = require("../maps");
const { chatManager } = require("../chat");
const templates = require("../templates");
const mapObjectManager = require("../MapObjectManager");
const db = require("../db");

function Admin(userData, socket) {
	console.timeLog(userData.name.info + " loged on as admin");
	socket.userData = userData;

	socket.on("disconnect", () => {
		chatManager.leaveAll(socket);
		console.timeLog(socket.userData.name.info + " logged off as admin");
		socket.exit();
	});

	// updates
	socket.updateUsers = () => {
		let data = db.users
			.find()
			.slice(socket.usersSelectLimit.min, socket.usersSelectLimit.max);
		socket.emit("usersUpdate", data);
	};
	socket.updateErrors = () => {
		let data = db.errors
			.find()
			.slice(socket.usersSelectLimit.min, socket.usersSelectLimit.max);

		socket.emit("updateErrors", data);
	};

	// maps
	socket.on("createMap", (data, cb) => {
		mapManager.createMap(data);
		if (cb) cb(true);
	});
	socket.on("deleteMap", (mapID, cb) => {
		mapManager.deleteMap(mapID);
		if (cb) cb(true);
	});
	socket.on("editMapInfo", (data, cb) => {
		let map = mapManager.getMap(data.id);
		map.importData(data);
		if (cb) cb(true);
		mapManager.emitMapsChanged();
	});
	socket.on("getChunk", ({ x, y, map }, cb) => {
		let chunk = mapManager.getChunk(x, y, map);
		if (cb) cb(chunk.exportData());
	});
	socket.on("updateLayers", (data, cb) => {
		let map = mapManager.getMap(data.map);

		map.layers = data.layers;
		if (cb) cb(true);

		mapManager.emitMapsChanged();
	});
	socket.on("tilesChange", (data, cb) => {
		mapManager.setTiles(data);
		if (cb) cb(true);
	});

	//layers
	socket.on("createLayer", (data, cb) => {
		mapManager.createLayer(data);
		if (cb) cb(mapManager.layers);
	});
	socket.on("deleteLayer", (id, cb) => {
		mapManager.deleteLayer(id);
		if (cb) cb(mapManager.layers);
	});
	socket.on("changeLayer", (data, cb) => {
		mapManager.changeLayer(data);
		if (cb) cb(mapManager.layers);
	});
	socket.emit("updateLayers", mapManager.layers);

	//objects
	socket.on("getObject", ({ id, type }, cb) => {
		let obj = objectController.getObject(id, type);
		if (cb) cb(obj.exportData());
	});
	socket.on("getObjects", ({ type, from, to }, cb) => {
		let objs = mapObjectManager.getObjectsOnPosition(type, from, to);
		if (cb) cb(objs.map(o => o.exportData()));
	});
	socket.on("objectCreate", ({ type, data }, cb) => {
		let obj = mapObjectManager.createObject(type, data);
		if (cb) cb(obj.exportData());
	});
	socket.on("objectChange", (data, cb) => {
		// data is a array of changed objs
		objectController.updateObject(data.id, data.type, data);
		if (cb) cb(true);
	});
	socket.on("objectDelete", (data, cb) => {
		objectController.deleteObject(data.id, data.type);
		if (cb) cb(true);
	});

	//templates
	socket.on("getTemplate", ({ id }, cb) => {
		let template = templates.getTemplate(id);
		if (cb) cb(template.exportData());
	});
	socket.on("getTemplates", cb => {
		let data = templates.getTemplates().map(t => t.exportData());
		if (cb) cb(data);
	});
	socket.on("templateCreate", (data, cb) => {
		templates.createTemplate(data);
		if (cb) cb(true);
	});
	socket.on("templateChange", (data, cb) => {
		templates.updateTemplate(data.id, data);
		if (cb) cb(true);
	});
	socket.on("templateDelete", (id, cb) => {
		templates.deleteTemplate(id);
		if (cb) cb(true);
	});

	//tileProperties
	socket.on("tilePropertiesChange", data => {
		mapManager.tilePropertiesChange(data);
	});

	// users
	socket.usersSelectLimit = {
		min: 0,
		max: 10,
	};
	socket.on("usersChangeLimit", function(limit, cb) {
		this.usersSelectLimit.min = limit.from;
		this.usersSelectLimit.max = limit.to;
		this.updateUsers();
	});
	socket.on("deleteUser", function(userID, cb) {
		db.query("DELETE FROM `users` WHERE id=" + db.ec(userID), function(data) {
			cb(data.affectedRows !== 0);
		});
	});
	socket.on("usersAdmin", function(data, cb) {
		db.query(
			"UPDATE `users` SET `admin`=" +
				db.ec(data.admin) +
				" WHERE id=" +
				db.ec(data.id),
			function(data) {
				cb(data.affectedRows !== 0);
			},
		);
	});
	socket.on("usersBanned", function(data, cb) {
		db.query(
			"UPDATE `users` SET `banned`=" +
				db.ec(data.banned) +
				" WHERE id=" +
				db.ec(data.id),
			function(data) {
				cb(data.affectedRows !== 0);
			},
		);
	});
	socket.on("createUser", function(userData, cb) {
		db.query(
			"INSERT INTO `users`(`name`, `email`, `password`) VALUES (" +
				db.ec(userData.name) +
				", " +
				db.ec(userData.email) +
				", " +
				db.ec(userData.password) +
				")",
			function(data) {
				db.query("SELECT * FROM users LIMIT 0, 10", function(data) {
					//might run into problems, need to send back the page, or sync what page im on with the client
					socket.emit("usersUpdate", data);
				});
				cb(true);
			},
		);
	});

	//chat
	if (socket.userData.admin) chatManager.join("Server", socket);
	// chatManager.joinDefault(socket)
	socket.on("chatChanelMessage", data => {
		chatManager.message(data.chanel, data.message);
	});
	socket.on("chatChanelLeave", data => {
		chatManager.leave(data.chanel, socket);
	});

	//errors
	socket.errorsPage = 0;
	socket.on("errorsChangePage", page => {
		socket.page = page;
		socket.updateErrors();
	});
	socket.on("errorsDelete", id => {
		db.errors.remove({ id });
		socket.updateErrors();
	});
	socket.on("errorsDeleteAll", () => {
		db.errors.find().forEach(err => {
			db.errors.remove({ id: err.id });
		});
		socket.updateErrors();
	});
	socket.updateErrors();

	socket.on("logError", err => {
		db.errors.save({
			...err,
			id: db.errors.count(),
			app: "admin",
		});
	});

	//cursors
	socket.cursorVisibility = false;
	socket.cursor = {
		mouseX: 0,
		mouseY: 0,
		viewX: 0,
		viewY: 0,
		map: -1,
		selectY: 0,
		selectX: 0,
		selectW: 0,
		selectH: 0,
		selected: 0,
	};
	socket.on("updateCursor", (data = {}) => {
		Object.assign(socket.cursor, data);
	});
	socket.on("updateCursorVisibility", data => {
		socket.cursorVisibility = data;
	});
	//update loop
	socket.updateCursorsLoop = () => {
		if (this.cursorVisibility) {
			const { playerManager } = require("./index");

			let cursors = [];
			playerManager.admins.forEach(admin => {
				if (
					admin.cursor.map === socket.cursor.map &&
					admin.cursorVisibility &&
					admin !== this
				) {
					cursors.push(
						Object.assign(
							{
								id: admin.userData.id,
								name: admin.userData.name,
							},
							admin.cursor,
						),
					);
				}
			});

			socket.emit("updateCursors", cursors);
		}

		setTimeout(socket.updateCursorsLoop, 200);
	};
	socket.updateCursorsLoop();

	socket.updateUsers();
	socket.emit("mapsChange", mapManager.getMapList());
	socket.emit("tilePropertiesChange", mapManager.tileProperties);

	socket.exit = () => {
		const { playerManager } = require("./index");

		//remove myself from admin list
		// TODO this is really bad, it should be moved the the PlayerManager
		playerManager.admins = playerManager.admins.filter(
			admin => admin.userData.id !== socket.userData.id,
		);
	};

	return socket;
}

//export
module.exports = Admin;
