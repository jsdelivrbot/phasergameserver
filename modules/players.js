http = require('http')
fs = require('fs')
Player = require('./player.js')

players = {
	players: [],
	admins: [],
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
					if(data.id.banned == false){
						//see if they are loged on
						for (var j = 0; j < players.players.length; j++) {
							if(data.id.id == players.players[j].id){
								cb(2);
								return;
							}
						};

						_player = new Player(data,socket);
						players.players.push(_player);

						cb(0,_player);
						return;
					}
					else{
						cb(3);
					}
				}
			}

			cb(1);
		})
	},
	adminLogin: function(email,password,socket,cb){
		db.query("SELECT * FROM users WHERE admin=1 AND email="+db.ec(email)+' AND password='+db.ec(password),function(data){
			if(data.length){
				data = data[0];
				if(password === data.password && data.admin === 1){
					//see if they are loged on
					for (var j = 0; j < players.admins.length; j++) {
						if(data.id == players.admins[j].userData.id){
							cb(2);
							return;
						}
					};

					_admin = Admin(data,socket);
					players.admins.push(_admin);

					cb(0,_admin);
					return;
				}
			}

			cb(1);
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