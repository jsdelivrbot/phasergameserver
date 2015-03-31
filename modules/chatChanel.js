var events = require('events');

function ChatChanel(data){
	data = data || {};

	this.events = new events.EventEmitter();
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
			var players = [];
			for (var i = 0; i < this.players.length; i++) {
				//tell the other players that a player joined
				this.players[i].emit('chatChanelPlayerJoin',{
					chanel: this.exportData(),
					player:{
						id: player.userID,
						name: player.userData.name
					}
				})

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
			
			this.players.push(player);
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
	message: function(from,message,dontFire){
		for (var i = 0; i < this.players.length; i++) {
			this.players[i].emit('chatChanelMessage',{
				chanel: this.exportData(),
				message: {
					from: from,
					message: message
				}
			})
		};

		if(!dontFire){
			this.events.emit('message',{
				from: from,
				message: message
			})
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