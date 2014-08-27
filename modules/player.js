PlayerIn = Class.$extend({
	name: '',
	callback: null,
	__init__: function(name,callback){
		this.name = name
		this.callback = callback
	},
	bind: function(socket){
		// in the callback "this" is the socket
		socket.on(this.name,this.callback)
	}
})

PlayerOut = Class.$extend({
	
})

module.exports = Class.$extend({
	socket: null,
	data: null, //playerData obj
	in: {
		update: new PlayerIn('update',function(data){
			// remove the id part of the data
			delete data.id
			this.player.data.update(data)
		}),
		disconnect: new PlayerIn('disconnect',function(data){
			console.log('player: '+this.player.data.data.id.name+' loged off')

			//remove player from the players: array
			for (var i = 0; i < players.players.length; i++) {
				if(players.players[i].data.data.id.id == this.player.data.data.id.id){
					players.players.splice(i,1)
					break;
				}
			};
		})
	},
	out: {},

	__init__: function(_playerData,_socket){
		this.socket = _socket
		this.socket.player = this
		this.socket.conn.player = this

		// load the player data
		this.data = new PlayerData(_playerData)

		console.log('player: '+this.data.data.id.name+' loged on')

		// bind socket events
		for (var val in this.in) {
			this.in[val].bind(this.socket)
		};
	},

	update: function(){
		// send the player a list of all the players
		a = []
		for (var i = 0; i < players.players.length; i++) {
			if(players.players[i].data.data.id.id != this.data.data.id.id){
				if(players.players[i].data.data.position.island == this.data.data.position.island && players.players[i].data.data.position.map == this.data.data.position.map){
					a.push(players.players[i].data.data)
				}
			}
		};

		this.socket.emit('players',a)
	}
})

// data = require('./data.js')
// users = data.get('users.json').data

// module.exports = function(usersData,socket){

// 	_player = {}

// 	_player.socket = socket
// 	_player.data = {
// 		id: usersData.id,
// 		position: usersData.position,
// 		sprite: {
// 			image: 'player/1',
// 			animations: {
// 				animation: 'down',
// 				paused: true
// 			}
// 		}
// 	}
	
// 	_player.socket.player = _player
// 	_player.socket.conn.player = _player

// 	console.log('player: '+_player.data.id.name+' loged on')

// 	//functions
// 	_player.update = function(){
// 		// send the player a list of all the players
// 		a = []
// 		for (var i = 0; i < players.players.length; i++) {
// 			if(players.players[i].data.id.id != this.data.id.id){
// 				a.push(players.players[i].data)
// 			}
// 		};

// 		if(a.length){
// 			this.socket.emit('players',a)
// 		}
// 	}

// 	//events
// 	_player.socket.on('update',function(event){
// 		this.player.data.position = event.position
// 		this.player.data.sprite = event.sprite
// 	})

// 	_player.socket.on('disconnect',function(event){
// 		console.log('player: '+this.player.data.id.name+' loged off')

// 		//remove player from the players: array
// 		for (var i = 0; i < module.parent.exports.players.length; i++) {
// 			if(module.parent.exports.players[i].id == this.player.id){
// 				module.parent.exports.players.splice(i,1)
// 				break;
// 			}
// 		};
// 	})

// 	return _player;
// }