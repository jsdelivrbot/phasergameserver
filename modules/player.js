/*
{
	id: number,
	name: string,
	email: string
	password: string,
	socket: socket.io
	position: {
		island: number,
		map: number,
		x: number,
		y: number
	}
}
*/
data = require('./data.js')
users = data.get('users.json').data

module.exports = function(usersData,socket){

	_player = {}

	_player.socket = socket
	_player.data = {
		id: usersData.id,
		position: usersData.position,
		sprite: {
			image: 'player/1',
			animations: {
				animation: 'down',
				paused: true
			}
		}
	}
	
	_player.socket.player = _player
	_player.socket.conn.player = _player

	console.log('player: '+_player.data.id.name+' loged on')

	//functions
	_player.update = function(){
		// send the player a list of all the players
		a = []
		for (var i = 0; i < Players.players.length; i++) {
			if(Players.players[i].data.id.id != this.data.id.id){
				a.push(Players.players[i].data)
			}
		};

		if(a.length){
			this.socket.emit('players',a)
		}
	}

	//events
	_player.socket.on('update',function(event){
		this.player.data.position = event.position
		this.player.data.sprite = event.sprite
	})

	_player.socket.on('disconnect',function(event){
		console.log('player: '+this.player.data.id.name+' loged off')

		//remove player from the players: array
		for (var i = 0; i < module.parent.exports.players.length; i++) {
			if(module.parent.exports.players[i].id == this.player.id){
				module.parent.exports.players.splice(i,1)
				break;
			}
		};
	})

	return _player;
}