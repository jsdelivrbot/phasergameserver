var http = require('http')
var fs = require('fs')
var Player = require('./player.js')
var events = require('events');

var loginMessages = [
	{
		message: 'success',
		class: 'success',
		success: true, //wether they login or not
	},
	{
		message: 'Wrong Email or Password',
		class: 'warning',
		success: false
	},
	{
		message: 'User Already Loged on',
		class: 'info',
		success: false
	},
	{
		message: 'User Banned',
		class: 'alert',
		success: false
	},
	{
		message: 'User not Admin',
		class: 'warning',
		success: false
	}
];

/*
events:
playerLogin: player,
adminLogin: admin,
*/

players = {
	players: [],
	admins: [],
	step: null,
	events: new events.EventEmitter(),

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
								cb(loginMessages[2]);
								return;
							}
						};

						_player = new Player(data,socket);
						players.players.push(_player);

						this.events.emit('playerLogin',_player);

						cb(loginMessages[0],_player);
						return;
					}
					else{
						cb(loginMessages[3]);
					}
				}
			}

			cb(loginMessages[1]);
		}.bind(this))
	},
	adminLogin: function(email,password,socket,cb){
		db.query("SELECT * FROM users WHERE admin=1 AND email="+db.ec(email)+' AND password='+db.ec(password),function(data){
			if(data.length){
				data = data[0];
				if(data.admin !== 1){
					cb(loginMessages[6])
					return;
				}
				if(password === data.password){
					//see if they are loged on
					for (var j = 0; j < players.admins.length; j++) {
						if(data.id == players.admins[j].userData.id){
							cb(loginMessages[2]);
							return;
						}
					};

					_admin = Admin(data,socket);
					players.admins.push(_admin);

					this.events.emit('adminLogin',_admin);

					cb(loginMessages[0],_admin);
					return;
				}
			}

			cb(loginMessages[1]);
		}.bind(this))
	},
	update: function(){
		// send down the data
		for (var i = 0; i < players.players.length; i++) {
			players.players[i].update()
		};
	},
	getPlayer: function(id){
		for (var i = 0; i < this.players.length; i++) {
			if(this.players[i].id === id){
				return this.players[i];
			}
		};
	},
	kick: function(id){
		var player = this.getPlayer(id);
		if(player){
			player.socket.conn.close();
		}
	},
	saveAll: function(cb){
		cb = _.after(players.players.length+1,cb);
		for (var i = 0; i < players.players.length; i++) {
			players.players[i].saveDown(cb)
		};
		cb();
	} 
}

//export
module.exports = players;