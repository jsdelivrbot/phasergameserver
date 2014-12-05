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