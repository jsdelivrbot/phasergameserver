var _ = require("underscore");
var EventEmitter = require("events");
var Player = require("./player.js");
var SortedArray = require("./sortedArray.js");
var db = require("./db");

var loginMessages = [
	{
		message: "success",
		class: "success",
		success: true //whether they login or not
	},
	{
		message: "Wrong Email or Password",
		class: "warning",
		success: false
	},
	{
		message: "User Already Logged on",
		class: "info",
		success: false
	},
	{
		message: "User Banned",
		class: "alert",
		success: false
	},
	{
		message: "User not Admin",
		class: "warning",
		success: false
	}
];

/*
events:
playerLogin: player,
adminLogin: admin,
*/

var players = {
	players: new SortedArray([], function(a, b) {
		if (a.userID === b.userID) return 0;
		if (a.userID < b.userID) {
			return -1;
		} else {
			return 1;
		}
	}),
	userData: new SortedArray([], function(a, b) {
		if (a.id === b.id) return 0;
		if (a.id < b.id) {
			return -1;
		} else {
			return 1;
		}
	}),
	playersPositions: {}, //an object of arrays(maps) which has players in it
	admins: [],
	step: null,
	saveTime: 1000,
	events: new EventEmitter(),

	//functions
	init: function() {
		//set up players
		this.step = setInterval(this.updateLoop, 100);
		// this.savePlayerLoop();
		// this.saveUserDataLoop();
	},
	getPlayer: function(id) {
		//gets player from the array
		if (this.playerOnline(id)) {
			return this.players[this.players.indexOf({ userID: id })];
		}
	},
	getUserData: function(id, cb) {
		var index = this.userData.indexOf({ id: id });
		if (index !== -1) {
			var data = this.userData[index];
			if (cb) cb();
		} else {
			this.loadUserData(id, cb);
		}
	},
	playerOnline: function(id) {
		return this.players.indexOf({ userID: id }) !== -1;
	},
	loadUserData: function(id, cb) {
		var userData = new UserData({
			id: id
		});
		userData._loading = true;

		this.userData.push(userData);

		db.query(
			"SELECT * `user-data` WHERE id=" + db.ec(id),
			function(data) {
				userData._loading = false;
				if (data.length) {
					userData.importData(data[0]);
				}
				if (cb) cb(userData);
			}.bind(this)
		);
	},
	removePlayer: function(id) {
		//removes player from array and closes conn
		if (this.playerOnline(id)) {
			this.getPlayer(id).conn.close(); //close the conn
			this.players.splice(this.players.indexOf({ userID: id }), 1);
		}
	},
	savePlayer: function(id, cb) {
		var player = this.getPlayer(id);
		if (player) {
			var data = player.exportData();
			sql = "UPDATE `users` SET ";
			var properties = [];
			//loop through the players exported data and save it
			for (var i in data) {
				if (i === "id") continue;
				properties.push("`" + i + "`=" + db.ec(data[i]) + "`");
			}
			sql += properties.join(", ");
			sql += " WHERE id=" + db.ec(player.userID);

			db.query(sql, cb);
		} else if (cb) cb();
	},
	saveUserData: function(id, cb) {
		this.getUserData(
			id,
			function(userData) {
				if (userData) {
					var data = userData.exportData();

					sql = "UPDATE `user-data` SET ";
					var properties = [];
					//loop through the userData data and save it
					for (var i in data) {
						if (i === "id") continue;
						properties.push("`" + i + "`=" + db.ec(data[i]) + "`");
					}
					sql += properties.join(", ");
					sql += " WHERE id=" + db.ec(player.userID);

					db.query(sql, cb);
				} else if (cb) cb();
			}.bind(this)
		);
	},
	saveAll: function(cb) {
		cb = _.after(players.players.length + 1, cb || function() {});
		for (var i = 0; i < players.players.length; i++) {
			players.players[i].save(cb);
		}
		cb();
	},
	saveAllPlayers: function(cb) {
		cb = _.after(players.players.length + 1, cb || function() {});
		for (var i = 0; i < players.players.length; i++) {
			players.players[i].save(cb);
		}
		cb();
	},
	saveAllUserData: function(cb) {
		cb = _.after(this.userData.length + 1, cb || function() {});
		for (var i = 0; i < this.userData.length; i++) {
			if (!this.userData[i]._saved) {
				this.saveUserData(this.userData[i].id, cb);
			} else cb();
		}
		cb();
	},
	updateLoop: function() {
		// send down the data
		for (var i = 0; i < players.players.length; i++) {
			players.players[i].update();
		}
	},
	savePlayerLoop: function(i) {
		i = i || 0;
		var player = this.players[i];
		this.savePlayer(
			player.id,
			function() {
				if (++i >= this.players.length) {
					i = 0;
				}
				setTimeout(this.savePlayerLoop.bind(this, i), this.saveTime);
			}.bind(this)
		);
	},
	saveUserDataLoop: function(i) {
		i = i || 0;
		var userData = this.userData[i];
		this.saveUserData(
			userData.id,
			function() {
				if (++i >= this.userData.length) {
					i = 0;
				}
				setTimeout(this.saveUserDataLoop.bind(this, i), this.saveTime);
			}.bind(this)
		);
	},

	login: function(email, password, socket, cb) {
		// db.player.getFromEmail(email,function(data){
		db.query(
			"SELECT * FROM users WHERE email=" +
				db.ec(email) +
				" AND password=" +
				db.ec(password),
			function(data) {
				if (data.length) {
					data = data[0];

					if (!data.banned) {
						//see if they are logged on
						if (this.players.indexOf({ id: data.id }) !== -1) {
							cb(loginMessages[2]);
							return;
						}

						// _player = new Player(data,socket);
						_player = Player(data, socket);
						players.players.push(_player);

						this.events.emit("playerLogin", _player);

						cb(loginMessages[0], _player);
						return;
					} else {
						cb(loginMessages[3]);
						return;
					}
				}

				cb(loginMessages[1]);
			}.bind(this)
		);
	},
	adminLogin: function(email, password, socket, cb) {
		db.query(
			"SELECT * FROM users WHERE email=" +
				db.ec(email) +
				" AND password=" +
				db.ec(password),
			function(data) {
				if (data.length) {
					data = data[0];
					if (!data.admin) {
						cb(loginMessages[4]);
						return;
					}
					if (password === data.password) {
						//see if they are logged on
						for (var j = 0; j < players.admins.length; j++) {
							if (data.id == players.admins[j].userData.id) {
								cb(loginMessages[2]);
								return;
							}
						}

						_admin = Admin(data, socket);
						players.admins.push(_admin);

						this.events.emit("adminLogin", _admin);

						cb(loginMessages[0], _admin);
						return;
					}
				}

				cb(loginMessages[1]);
			}.bind(this)
		);
	}
};

//export
module.exports = players;

UserData = function(data) {
	this.data = {};
	this.importData(data);
};
UserData.prototype = {
	_saved: true,
	_loading: false,
	data: {},
	importData: function(data) {
		for (var i in data) {
			if (this.data[i]) {
				this.data[i] = data[i];
			}
		}
	},
	exportData: function() {
		return this.data;
	}
};
UserData.prototype.constructor = UserData;
Object.defineProperties(UserData.prototype, {
	id: {
		get: function() {
			return this.data.id;
		},
		set: function(val) {
			return (this.data.id = val);
		}
	},
	name: {
		get: function() {
			return this.data.name;
		},
		set: function(val) {
			return (this.data.name = val);
		}
	},
	health: {
		get: function() {
			return this.data.health;
		},
		set: function(val) {
			return (this.data.health = val);
		}
	},
	inventory: {
		get: function() {
			return this.data.inventory;
		},
		set: function(val) {
			return (this.data.inventory = val);
		}
	},
	image: {
		get: function() {
			return this.data.image;
		},
		set: function(val) {
			return (this.data.image = val);
		}
	},
	map: {
		get: function() {
			return this.data.map;
		},
		set: function(val) {
			return (this.data.map = val);
		}
	},
	x: {
		get: function() {
			return this.data.x;
		},
		set: function(val) {
			return (this.data.x = val);
		}
	},
	y: {
		get: function() {
			return this.data.y;
		},
		set: function(val) {
			return (this.data.y = val);
		}
	}
});
