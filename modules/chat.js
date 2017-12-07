const EventEmitter = require("events");
const ChatChanel = require("./chatChanel");

class ChatManager {
	constructor() {
		this.events = new EventEmitter();
		this.chanels = [];
	}
	createChanel(settings) {
		let chanel = new ChatChanel(settings);
		chanel.manager = this;
		this.chanels.push(chanel);
		return chanel;
	}
	getChanel(id) {
		return this.chanels[id];
	}
	getChanelByTitle(title) {
		return this.chanels.find(chanel => chanel.settings.title === title);
	}
	join(id, player) {
		let chanel;
		if (typeof id === "string") chanel = this.getChanelByTitle(id);
		else chanel = this.getChanel(id);

		if (chanel) chanel.join(player);
	}
	joinDefault(player) {
		this.chanels
			.filter(ch => ch.settings.default)
			.forEach(ch => ch.join(player));
	}
	leave(id) {
		let chanel;
		if (typeof id === "string") chanel = this.getChanelByTitle(id);
		else chanel = this.getChanel(id);

		if (chanel) chanel.leave(player);
	}
	leaveAll(player) {
		this.chanels.forEach(ch => ch.leave(player));
	}
	message(id, message, dontFire) {
		let chanel;
		if (typeof id === "string") chanel = this.getChanelByTitle(id);
		else chanel = this.getChanel(id);

		if (chanel) chanel.message(message, dontFire);
	}
}

let inst;
Object.defineProperty(ChatManager, "inst", {
	get() {
		return inst || (inst = new ChatManager());
	}
});

module.exports = ChatManager.inst;
