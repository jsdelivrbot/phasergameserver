var ChatChanel = require('./chatChanel.js');
var events = require('events');

chat = {
	events: new events.EventEmitter(),
	chanels: [],
	init: function(){
		//add genral chanel
		this.createChanel({
			title: 'Genral',
			default: true,
			canLeave: false
		})
		//create server chanel
		this.createChanel({
			title: 'Server',
			canLeave: false
		})
		this.getChanelByTitle('Server').events.on('message',function(data){
			commands.readline.write(data.message + ' \n');
		})
	},
	createChanel: function(data){
		this.chanels.push(new ChatChanel(data));
	},
	getChanel: function(id){
		return this.chanels[id];
	},
	getChanelByTitle: function(title){
		for (var i = 0; i < this.chanels.length; i++) {
			if(this.chanels[i].settings.title == title){
				return this.chanels[i];
			}
		};
	},
	join: function(id,player){
		if(_.isString(id)){
			var chanel = this.getChanelByTitle(id);
		}
		else{
			var chanel = this.getChanel(id);
		}

		if(chanel){
			chanel.join(player);
		}
	},
	joinDefault: function(player){
		for (var i = 0; i < this.chanels.length; i++) {
			if(this.chanels[i].settings.default){
				this.chanels[i].join(player);
			}
		};
	},
	leave: function(id){
		if(_.isString(id)){
			var chanel = this.getChanelByTitle(id);
		}
		else{
			var chanel = this.getChanel(id);
		}

		if(chanel){
			chanel.leave(player);
		}
	},
	leaveAll: function(player){
		for (var i = 0; i < this.chanels.length; i++) {
			this.chanels[i].leave(player);
		};
	},
	message: function(id,from,message,dontFire){
		if(_.isString(id)){
			chanel = this.getChanelByTitle(id);
		}
		else{
			chanel = this.getChanel(id);
		}

		if(chanel){
			chanel.message(from,message,dontFire);
		}
	}
}

module.exports = chat;