const EventEmitter = require("events");

class ChatChanel {
	constructor(settings = {}) {
		this.events = new EventEmitter();
		this.players = [];
		this.manager = null;
		this.settings = Object.assign(
			{
				title: "",
				owner: -1,
				default: false,
				canLeave: true,
				canSendMessage: true
			},
			settings
		);
	}

	get id() {
		return this.manager ? this.manager.chanels.indexOf(this) : -1;
	}

	join(player) {
		if (this.players.includes(player)) return;

		// tell the other players the player is joining
		this.players.forEach(otherPlayer => {
			otherPlayer.emit("chatChanelPlayerJoin", {
				chanel: this.exportData(),
				player: {
					id: player.userID,
					name: player.userData.name
				}
			});
		});

		// send the channel data to the joining player
		player.emit("chatChanelJoin", {
			chanel: this.exportData(),
			players: this.players.map(p => ({
				id: p.userId,
				name: p.userData.name
			}))
		});

		//add the player to the channel
		this.players.push(player);

		this.events.emit("playerJoined", {
			chanel: this.exportData(),
			player: player
		});
	}
	leave(player) {
		if (!this.players.includes(player)) return;

		this.players.splice(this.players.indexOf(player), 1);

		// notify the other players
		this.players.forEach(otherPlayer => {
			otherPlayer.emit("chatChanelPlayerLeave", {
				chanel: this.exportData(),
				player: {
					id: player.userId,
					name: player.userData.name
				}
			});
		});

		player.emit("chatChanelLeave", this.exportData());

		this.events.emit("playerLeave", {
			chanel: this.exportData(),
			player: player
		});
	}
	message(message = {}, dontFire) {
		message = Object.assign(
			{
				to: "",
				from: "",
				message: ""
			},
			message
		);

		this.players.forEach(player => {
			if (message.to === player.userData.name || !message.to) {
				player.emit("chatChanelMessage", {
					chanel: this.exportData(),
					message: message
				});
			}
		});

		if (!dontFire) {
			this.events.emit("message", message);
		}
	}
	exportData() {
		return {
			id: this.id,
			settings: this.settings
		};
	}
}

module.exports = ChatChanel;
