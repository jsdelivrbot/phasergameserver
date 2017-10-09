var EventEmitter = require('events');

function ChatChanel(data){
	data = data || {};

	this.events = new EventEmitter();
	this.players = [];
	this.settings = fn.combindOver(fn.duplicate(this.settings),data);
}
ChatChanel.prototype = {
	events: undefined,
	settings: {
		title: '',
		owner: -1,
		default: false,
		canLeave: true,
		canSendMessage: true
	},
	players: [],
	join: function(player){
		if(this.players.indexOf(player) == -1){
			this.players.push(player);

			var players = [];
			for (var i = 0; i < this.players.length; i++) {
				//tell the other players that a player joined
				if(this.players[i] !== player){
					this.players[i].emit('chatChanelPlayerJoin',{
						chanel: this.exportData(),
						player:{
							id: player.userID,
							name: player.userData.name
						}
					})
				}

				//buid the player list
				players.push({
					id: this.players[i].userID,
					name: this.players[i].userData.name
				});
			};
			player.emit('chatChanelJoin',{
				chanel: this.exportData(),
				players: players
			})

			this.events.emit('playerJoined',{
				chanel: this.exportData(),
				player: player
			})
		}
	},
	leave: function(player){
		if(this.players.indexOf(player) !== -1){
			this.players.splice(this.players.indexOf(player),1);

			for (var i = 0; i < this.players.length; i++) {
				this.players[i].emit('chatChanelPlayerLeave',{
					chanel: this.exportData(),
					player: {
						id: player.userID,
						name: player.userData.name
					}
				})
			};

			player.emit('chatChanelLeave',this.exportData());

			this.events.emit('playerLeave',{
				chanel: this.exportData(),
				player: player
			})
		}
	},
	message: function(message,dontFire){
		message = fn.combindOver({
			to: '',
			from: '',
			message: ''
		},message || {})

		for (var i = 0; i < this.players.length; i++) {
			if(this.players[i].userData.name === message.to || message.to.length == 0){
				this.players[i].emit('chatChanelMessage',{
					chanel: this.exportData(),
					message: message
				})
			}
		};

		if(!dontFire){
			this.events.emit('message',message)
		}
	},
	exportData: function(){
		return {
			id: this.id,
			settings: this.settings
		};
	}
}
ChatChanel.prototype.__defineGetter__('id',function(){
	return chat.chanels.indexOf(this);
})

module.exports = ChatChanel;