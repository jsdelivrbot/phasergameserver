PlayerIn = Klass({
	name: '',
	callback: null,
	initialize: function(name,callback){
		this.name = name
		this.callback = callback
	},
	bind: function(socket){
		// in the callback "this" is the socket
		socket.on(this.name,this.callback)
	}
})

PlayerOut = Klass({
	name: '',
	socket: null,
	initialize: function(name){
		this.socket = null
		this.name = name
	},
	data: function(data){
		if(this.socket){
			this.socket.emit(this.name,data)
		}
	},
	bind: function(socket){
		this.socket = socket
	}
})

PlayerOutCache = PlayerOut.extend({
	_data: null,
	changed: false,
	initialize: function(name,timing){
		this.supr(name)

		setInterval(this.test,timing,this)
	},
	data: function(data){
		if(JSON.stringify(data) !== JSON.stringify(this._data)){
			this._data = fn.duplicate(data)
			this.changed = true
		}
	},
	test: function(_this){
		if(_this.changed){
			_this.send(_this._data)
		}
	},
	send: function(data){
		if(this.socket){
			this.socket.emit(this.name,data)
			this.changed = false
		}
	}
})

PlayerData = Klass({
	data: {
		id: {
			id: 0,
			name: '',
			email: '',
			passowrd: ''
		},
		position: {
			body: {
				x: 0,
				y: 0,
				vx: 0,
				vy: 0
			},
			island: 0,
			map: 0
		},
		sprite: {
			image: 'player/1',
			animations: {
				animation: 'down',
				playing: false
			}
		}
	},

	initialize: function(_data){
		this.data = fn.duplicate(this.data)
		// put the data into this.data
		if(_data){
			fn.combind(this.data,_data)
		}
	},

	update: function(_data){
		// put the data into this.data
		fn.combind(this.data,_data)
	}
})

module.exports = Klass({
	socket: null,
	data: null, //playerData obj
	in: null,
	out: null,

	initialize: function(_playerData,_socket){
		// this.in = fn.duplicate(this.in,2)
		// this.out = fn.duplicate(this.out,2)

		this.socket = _socket
		this.socket.player = this
		this.socket.conn.player = this

		// load the player data
		this.data = new PlayerData(_playerData)

		console.log('player: '+this.data.data.id.name+' loged on')

		// tell the other players that he loged off
		m = {
			name: 'Server',
			message: this.data.data.id.name + ' loged on'
		}

		for (var i = 0; i < players.players.length; i++) {
			if(players.players[i].data.data.id.id != this.data.data.id.id){
				players.players[i].out.chat.data(m)
			}
		};

		this.in = {
			update: new PlayerIn('update',function(data){
				// remove the id part of the data
				delete data.id
				this.player.data.update(data)
			}),
			chat: new PlayerIn('chat',function(data){
				m = {
					name: this.player.data.data.id.name,
					message: data
				}

				for (var i = 0; i < players.players.length; i++) {
					players.players[i].out.chat.data(m)
				};
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

				// tell the other players that he loged off
				m = {
					name: 'Server',
					message: this.player.data.data.id.name + ' loged off'
				}

				for (var i = 0; i < players.players.length; i++) {
					players.players[i].out.chat.data(m)
				};
			})
		}
		this.out = {
			players: new PlayerOutCache('players',100),
			chat: new PlayerOut('chat')
		}

		// bind socket events
		for (var val in this.in) {
			this.in[val].bind(this.socket)
		};
		for (var val in this.out) {
			this.out[val].bind(this.socket)
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

		this.out.players.data(a)
	}
})