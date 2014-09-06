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

PlayerDataFull = Klass({
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
				y: 0
			},
			island: 0,
			map: 0
		},
		sprite: {
			image: 'player/1'
		},
		inventory: {},
		skills: {}
	},

	initialize: function(_data){
		this.data = fn.duplicate(this.data)
		// put the data into this.data
		if(_data){
			this.update(_data)
		}
	},
	update: function(_data){
		// put the data into this.data
		if(_data instanceof PlayerData){
			this.updateFromPlayerData(_data)
		}
		else if(_data instanceof PlayerDataFull){
			this.updateFromPlayerDataFull(_data)
		}
		else{
			// json
			this.updateFromJSON(_data)
		}
	},
	updateFromJSON: function(_data){
		fn.combindIn(this.data,_data)
	},
	updateFromPlayerData: function(_playerData){
		fn.combindIn(this.data,_playerData.data);
	},
	updateFromPlayerDataFull: function(_playerDataFull){
		fn.combindOver(this.data,_playerDataFull.data);
	},
	toPlayerData: function(){
		return fn.combindIn(new PlayerData(),this.data);
	},
	toPlayerDataJSON: function(){
		return new PlayerData(this).data;
	}
})

PlayerData = Klass({
	data: {
		id: {
			id: 0,
			name: ''
		},
		position: {
			body: {
				x: 0,
				y: 0
			},
			island: 0,
			map: 0
		},
		sprite: {
			image: 'player/1'
		}
	},

	initialize: function(_data){
		this.data = fn.duplicate(this.data)
		// put the data into this.data
		if(_data){
			this.update(_data)
		}
	},
	update: function(_data){
		// put the data into this.data
		if(_data instanceof PlayerData){
			this.updateFromPlayerData(_data)
		}
		else if(_data instanceof PlayerDataFull){
			this.updateFromPlayerDataFull(_data)
		}
		else{
			// json
			this.updateFromJSON(_data)
		}
	},
	updateFromJSON: function(_data){
		fn.combindIn(this.data,_data)
	},
	updateFromPlayerData: function(_playerData){
		fn.combindOver(this.data,_playerData.data);
	},
	updateFromPlayerDataFull: function(_playerDataFull){
		fn.combindIn(this.data,_playerDataFull.data);
	},
	toPlayerDataFull: function(){
		return new PlayerDataFull(this.data)
	},
	toPlayerDataFullJSON: function(){
		return new PlayerDataFull(this).data
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
		this.data = new PlayerDataFull(_playerData)

		console.log('player: '+this.data.data.id.name+' loged on')

		this.in = {
			update: new PlayerIn('update',function(data){
				// remove the id part of the data
				delete data.id
				this.player.data.update(data)
			}),
			chat: new PlayerIn('chat',function(data){
				// type
				switch(data.type){
					case 'message':
						chat.message(data.chanel,data.message,this.player)
						break;
					case 'create':
						// find the players
						c = chat.createChanel({
							title: data.title,
							owner: this.player.data.data.id.id,
						})

						chat.join(c,this.player)

						for (var i = 0; i < data.players.length; i++) {
							for (var j = 0; j < players.players.length; j++) {
								if(players.players[j].data.data.id.id == data.players[i]){
									chat.join(c,players.players[j])
								}
							};
						};
						break;
					case 'invite':
						for (var j = 0; j < players.players.length; j++) {
							if(players.players[j].data.data.id.name == data.player){
								// now see if the player is aleardy there
								found = false
								for (var i = 0; i < chat.chanels[data.chanel].players.length; i++) {
									if(chat.chanels[data.chanel].players[i].data.data.id.name == data.player){
										found = true;
									}
								};
								if(!found){
									chat.join(data.chanel,players.players[j])
								}
							}
						};
						break;
					case 'leave':
						chat.leave(data.chanel,this.player)
						break;
					case 'close':
						chat.leave(data.chanel,this.player)
						break;
				}
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

				chat.leaveAll(this.player)
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

		// join the genral chanel
		chat.join('0',this)
	},

	update: function(){
		// send the player a list of all the players
		a = []
		for (var i = 0; i < players.players.length; i++) {
			if(players.players[i].data.data.id.id != this.data.data.id.id){
				if(players.players[i].data.data.position.island == this.data.data.position.island && players.players[i].data.data.position.map == this.data.data.position.map){
					a.push(players.players[i].data.toPlayerDataJSON())
				}
			}
		};

		this.out.players.data(a)
	}
})