PlayerIn = Klass({
	name: '',
	callback: null,
	data: {},
	initialize: function(name,callback){
		this.name = name || ''
		this.callback = callback
		this.data = fn.duplicate(this.data);
	},
	bind: function(socket){
		if(this.callback){
			f = _.partial(function(_this,callback,data){
				_this.data = data;
				callback = _.bind(callback,this);
				callback(data);
			},this,this.callback)
			socket.on(this.name,f)
		}
	}
})

PlayerInDiff = PlayerIn.extend({
	bind: function(socket){
		if(this.callback){
			f = _.partial(function(_this,callback,diff){
				fn.applyDiff(_this.data,diff);
				callback = _.bind(callback,this);
				callback(diff);
			},this,this.callback)
			socket.on(this.name,f)
		}
	}
})

PlayerOut = Klass({
	name: '',
	socket: null,
	initialize: function(name){
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
		this._data = fn.duplicate(this._data);

		setInterval(_(this.test).bind(this),timing)
	},
	data: function(data){
		if(JSON.stringify(data) !== JSON.stringify(this._data)){
			this._data = fn.duplicate(data);
			this.changed = true
		}
	},
	test: function(){
		if(this.changed){
			this.send(this._data)
		}
	},
	send: function(data){
		if(this.socket){
			this.socket.emit(this.name,data)
			this.changed = false
		}
	}
})

PlayerOutDiff = PlayerOut.extend({
	_data: {},
	initialize: function(name){
		this.supr(name)
		this._data = fn.duplicate(this._data);
	},
	data: function(data){
		if(this.socket){
			var diff = fn.getDiff(this._data,data)
			if(!fn.isEmptyDiff(diff)){
				this.socket.emit(this.name,diff)
				this._data = fn.duplicate(data);
			}
		}
	}
})

//player data
PlayerDataFull = Klass({
	data: {
		id: {
			id: 0,
			name: '',
			email: '',
			password: ''
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
		this.data = fn.duplicate(this.data);
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
		fn.combindOver(this.data,_data) //using combind over because combind in dose not work well with arrays
	},
	updateFromPlayerData: function(_playerData){
		fn.combindOver(this.data,_playerData.data);
	},
	updateFromPlayerDataFull: function(_playerDataFull){
		fn.combindOver(this.data,_playerDataFull.data);
	},
	toPlayerData: function(){
		return new PlayerData(this);
	},
	toPlayerDataJSON: function(){
		return new PlayerData(this).data;
	},
	toSave: function(){
		return fn.duplicate(this.data);
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
		this.data = fn.duplicate(this.data);
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
		fn.combindIn(this.data,_playerDataFull.data);
	},
	toPlayerDataFull: function(){
		return new PlayerDataFull(this.data)
	},
	toPlayerDataFullJSON: function(){
		return new PlayerDataFull(this).data
	}
})

//player
Player = Klass({
	socket: null,
	data: null, //playerData obj
	inventory: [],
	in: null,
	out: null,

	// short hands
	id: -1,
	name: '',

	initialize: function(_playerData,_socket){
		// this.in = fn.duplicate(this.in,2)
		// this.out = fn.duplicate(this.out,2)

		this.socket = _socket
		this.socket.player = this
		this.socket.conn.player = this

		// load the player data
		this.data = new PlayerDataFull(_playerData)
		this.data.player = this

		this.inventory = [];

		console.log('player: '+this.data.data.id.name+' loged on')

		this.in = {
			player: new PlayerInDiff('player',function(diff){
				this.player.data.update(fn.buildDiff(diff))
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

				// save my data to the file
				this.player.saveDown();
			}),
			inventory: new PlayerInDiff('inventory',function(diff){
				fn.applyDiff(this.player.inventory,diff);
				fn.applyDiff(this.player.out.inventory._data,diff)
			})
		}
		this.out = {
			player: new PlayerOutDiff('player'),
			players: new PlayerOutCache('players',100),
			chat: new PlayerOut('chat'),
			inventory: new PlayerOutDiff('inventory')
		}

		// bind socket events
		for (var val in this.in) {
			this.in[val].bind(this.socket)
		};
		for (var val in this.out) {
			this.out[val].bind(this.socket)
		};

		//send the data position/inventory to the player
		this.out.player.data(this.data.data);
		this.out.inventory.data(this.inventory);

		// set up the short hands
		this.id = this.data.data.id.id
		this.name = this.data.data.id.name
	},

	update: function(){
		// send the player a list of all the players
		a = {}
		for (var i = 0; i < players.players.length; i++) {
			if(players.players[i].id !== this.id){
				if(players.players[i].data.data.position.island == this.data.data.position.island && players.players[i].data.data.position.map == this.data.data.position.map){
					a[players.players[i].id] = players.players[i].data.toPlayerDataJSON()
				}
			}
		};

		this.out.players.data(a)
	},

	saveDown: function(){
		// find the spot in the json 
		usersData = players.users
		for (var i = 0; i < usersData.length; i++) {
			if(usersData[i].id.id == this.id){
				usersData[i] = this.data.data
			}
		};
	}
})

module.exports = Player;