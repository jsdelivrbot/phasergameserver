// module.exports = Klass({
// 	players: [],
// 	users: [],
// 	step: null,

// 	initialize: function(){
// 		fs.readFile('data/users.json', _(function (err, data) {
// 		  	if (err) throw err;
// 		  	console.log('loaded user data');

// 		  	this.users = JSON.parse(data);
// 		}).bind(this))
// 		this.step = setInterval(this.update,100,this)
// 	},

// 	login: function(email,password,socket){
// 		for (var i = 0; i < this.users.length; i++) {
// 			if(email === this.users[i].id.email && password === this.users[i].id.password){
// 				for (var j = 0; j < this.players.length; j++) {
// 					if(this.users[i].id.id == this.players[j].id){
// 						return false;
// 					}
// 				};

// 				_player = new Player(this.users[i],socket)
// 				this.players.push(_player)

// 				// return the playerData object
// 				return _player;
// 			}
// 		};
// 		return false;
// 	},

// 	update: function(_this){
// 		// send down the dat
// 		for (var i = 0; i < _this.players.length; i++) {
// 			_this.players[i].update()
// 		};
// 	},

// 	saveDownAll: function(){
// 		for (var i = 0; i < this.players.length; i++) {
// 			this.players[i].saveDown()
// 		};
// 	}
// })

http = require('http')
fs = require('fs')
Player = require('./player.js')

players = {
	players: [],
	users: [],
	step: null,

	//functions
	login: function(email,password,socket){
		for (var i = 0; i < players.users.length; i++) {
			if(email === players.users[i].id.email && password === players.users[i].id.password){
				for (var j = 0; j < players.players.length; j++) {
					if(players.users[i].id.id == players.players[j].id){
						return false;
					}
				};

				_player = new Player(players.users[i],socket)
				players.players.push(_player)

				// return the playerData object
				return _player;
			}
		};
		return false;
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

//set up players
players.step = setInterval(players.update,100)

fs.readFile('data/users.json', function (err, data) {
  	if (err) throw err;
  	console.log('loaded user data');

  	players.users = JSON.parse(data);
})

//export
module.exports = players;