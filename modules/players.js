http = require('http')
fs = require('fs')
Player = require('./player.js')

players = {
	players: [],
	step: null,

	//functions
	init: function(){
		//set up players
		this.step = setInterval(this.update,100)
	},
	login: function(email,password,socket,cb){
		db.player.getFromEmail(email,function(data){
			if(data){
				if(password === data.id.password){
					//see if they are loged on
					for (var j = 0; j < players.players.length; j++) {
						if(data.id.id == players.players[j].id){
							cb(false);
							return;
						}
					};

					_player = new Player(data,socket);
					players.players.push(_player);

					cb(_player);
					return;
				}
			}

			cb(false);
		})
	},
	update: function(){
		// send down the data
		for (var i = 0; i < players.players.length; i++) {
			players.players[i].update()
		};
	},
	saveDownAll: function(){
		for (var i = 0; i < players.players.length; i++) {
			players.players[i].saveDown()
		};
	} 
}

//export
module.exports = players;