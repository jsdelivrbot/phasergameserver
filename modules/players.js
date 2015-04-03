var http = require('http')
var fs = require('fs')
var Player = require('./player.js')
var SortedArray = require('./sortedArray.js')

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
	players: new SortedArray([],function(a,b){
		if(a.userID === b.userID) return 0;
		if(a.userID < b.userID){
			return -1;
		}
		else{
			return 1;
		}
	}),
	playersPositions: {}, //an object of arrays(maps) which has players in it
	admins: [],
	step: null,
	events: new process.EventEmitter(),

	//functions
	init: function(){
		//set up players
		this.step = setInterval(this.updateLoop,100)
	},
	getPlayer: function(id){ //gets player from the array
		if(this.playerOnline(id)){
			return this.players[this.players.indexOf({userID:id})];
		}
	},
	playerOnline: function(id){
		return this.players.indexOf({userID:id}) !== -1;
	},
	removePlayer: function(id){ //removes player from array and closes conn
		if(this.playerOnline(id)){
			this.getPlayer(id).conn.close(); //close the conn
			this.players.splice(this.players.indexOf({userID:id}),1);
		}
	},
	savePlayer: function(id,cb){
		var player = this.getPlayer(id);
		if(player){
			var data = player.exportData();
			sql = 'UPDATE `users` SET ';
			//loop through the players exported data and save it
			for (var i in data) {
				if(i == 'id') continue;
				sql += '`'+i+'`='+db.ec(data[i])+', ';
			};
			sql = sql.substring(0,sql.length-2);
			sql += ' WHERE id='+db.ec(player.userID);

			db.query(sql,cb);
		}
	},
	saveAll: function(cb){
		cb = _.after(players.players.length+1,cb);
		for (var i = 0; i < players.players.length; i++) {
			players.players[i].save(cb)
		};
		cb();
	},
	updateLoop: function(){
		// send down the data
		for (var i = 0; i < players.players.length; i++) {
			players.players[i].update()
		};
	},
	kick: function(id){
		var player = this.getPlayer(id);
		if(player){
			player.socket.conn.close();
		}
	},

	login: function(email,password,socket,cb){
		// db.player.getFromEmail(email,function(data){
		db.query("SELECT * FROM users WHERE email="+db.ec(email)+' AND password='+db.ec(password),function(data){
			if(data.length){
				data = data[0];

				if(!data.banned){
					//see if they are loged on
					if(this.players.indexOf({id: data.id}) !== -1){
						cb(loginMessages[2]);
						return;
					}

					// _player = new Player(data,socket);
					_player = Player(data,socket);
					players.players.push(_player);

					this.events.emit('playerLogin',_player);

					cb(loginMessages[0],_player);
					return;
				}
				else{
					cb(loginMessages[3]);
					return;
				}
			};

			cb(loginMessages[1]);
		}.bind(this))
	},
	adminLogin: function(email,password,socket,cb){
		db.query("SELECT * FROM users WHERE email="+db.ec(email)+' AND password='+db.ec(password),function(data){
			if(data.length){
				data = data[0];
				if(!data.admin){
					cb(loginMessages[4])
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
}

//export
module.exports = players;