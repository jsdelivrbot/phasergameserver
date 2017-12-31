const EventEmitter = require("events");
const db = require("../db");

const Player = require("./Player");
const Admin = require("./Admin");

const LOGIN_MESSAGES = {
	SUCCESS: {
		message: "success",
		class: "success",
		success: true, //whether they login or not
	},
	BAD_LOGIN: {
		message: "Wrong Email or Password",
		class: "warning",
		success: false,
	},
	ALREADY_LOGGED_IN: {
		message: "User Already Logged on",
		class: "info",
		success: false,
	},
	BANNED: {
		message: "User Banned",
		class: "alert",
		success: false,
	},
	NOT_ADMIN: {
		message: "User not Admin",
		class: "warning",
		success: false,
	},
};

class UserData {
	constructor(data) {
		this.data = {};

		data && this.importData(data);
	}

	importData(data) {
		Object.assign(this.data, data);
	}
	exportData() {
		return this.data;
	}

	get id() {
		return this.data.id;
	}
	set id(val) {
		return (this.data.id = val);
	}
	get name() {
		return this.data.name;
	}
	set name(val) {
		return (this.data.name = val);
	}
	get health() {
		return this.data.health;
	}
	set health(val) {
		return (this.data.health = val);
	}
	get inventory() {
		return this.data.inventory;
	}
	set inventory(val) {
		return (this.data.inventory = val);
	}
	get image() {
		return this.data.image;
	}
	set image(val) {
		return (this.data.image = val);
	}
	get map() {
		return this.data.map;
	}
	set map(val) {
		return (this.data.map = val);
	}
	get x() {
		return this.data.x;
	}
	set x(val) {
		return (this.data.x = val);
	}
	get y() {
		return this.data.y;
	}
	set y(val) {
		return (this.data.y = val);
	}
}

class PlayerManager extends EventEmitter {
	constructor() {
		super();

		this.players = [];
		this.admins = [];
		this.userData = [];
		this.step = setInterval(this.updateLoop.bind(this), 100);

		// TODO remove once other classes on depend on .events
		this.events = this;
	}

	updateLoop() {
		// send down the data
		this.players.forEach(player => player.update());
	}

	getPlayer(id) {
		return this.players.find(player => player.userID === id);
	}
	playerOnline(id) {
		return !!this.getPlayer(id);
	}
	removePlayer(id) {
		if (this.playerOnline(id)) {
			let player = this.getPlayer(id);

			// TODO move this logic onto the player
			player.conn.close();

			this.players = this.players.filter(player => player.userID !== id);

			this.emit("playerRemoved", id);
		}

		return this;
	}
	savePlayer(id) {
		let player = this.getPlayer(id);
		if (player) {
			db.players.update({ userId: id }, player.exportData(), { upsert: true });

			this.emit("playerSaved", id);
		}
	}
	saveAllPlayers() {
		this.players.forEach(({ userId }) => this.savePlayer(userId));
		return this;
	}

	getUserData(id) {
		let userData = this.userData.find(data => data.id === id);
		if (!userData) {
			userData = this.loadUserData(id);
		}
		return userData;
	}
	loadUserData(id) {
		let data = db.userData.find({ id })[0];
		let userData = new UserData(data || { id });
		this.userData.push(userData);

		return userData;
	}
	saveUserData(id) {
		let userData = this.getUserData(id);
		if (userData) {
			db.userData.update({ userId: id }, userData.exportData(), {
				upsert: true,
			});

			this.emit("userDataSaved", id);
		}
		return this;
	}
	saveAllUserData() {
		this.userData.forEach(({ id }) => this.saveUserData(id));
		return this;
	}

	saveAll() {
		this.saveAllPlayers();
		this.saveAllUserData();
	}

	login(email, password, socket, cb) {
		let user = db.users.find({ email, password })[0];

		if (user) {
			if (this.getPlayer(user.id)) {
				cb(LOGIN_MESSAGES.ALREADY_LOGGED_IN);
				return false;
			}

			if (!user.banned) {
				let player = new Player(user, socket);
				this.players.push(player);

				this.emit("playerLogin", player);

				cb(LOGIN_MESSAGES.SUCCESS, player);
			} else {
				cb(LOGIN_MESSAGES.BANNED);
			}
		} else {
			cb(LOGIN_MESSAGES.BAD_LOGIN);
		}
		return false;
	}
	adminLogin(email, password, socket, cb) {
		let user = db.users.find({ email, password })[0];

		if (user) {
			if (!user.admin) {
				cb(LOGIN_MESSAGES.NOT_ADMIN);
				return false;
			}

			//see if they are logged on
			if (this.admins.find(p => p.userData.id === user.id)) {
				cb(LOGIN_MESSAGES.ALREADY_LOGGED_IN);
				return false;
			}

			let admin = Admin(user, socket);
			this.admins.push(admin);

			this.events.emit("adminLogin", admin);

			cb(LOGIN_MESSAGES.SUCCESS, admin);
		} else {
			cb(LOGIN_MESSAGES.BAD_LOGIN);
		}
		return false;
	}
}

let inst;
Object.defineProperty(PlayerManager, "inst", {
	get() {
		return inst || (inst = new PlayerManager());
	},
});

module.exports = PlayerManager;
