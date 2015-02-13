Klass = require('Klass');

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
			f = _.partial(function(_this,callback,data,cb){
				_this.data = data;
				callback = _.bind(callback,this);
				callback(data,cb);
			},this,this.callback)
			socket.on(this.name,f)
		}
	}
})

PlayerInDiff = PlayerIn.extend({
	bind: function(socket){
		if(this.callback){
			f = _.partial(function(_this,callback,diff,cb){
				fn.applyDiff(_this.data,diff);
				callback = _.bind(callback,this);
				callback(diff,cb);
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
			map: 0,
			loading: false
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
		health: 1000,
		position: {
			body: {
				x: 0,
				y: 0
			},
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
	health: 1000,
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

		console.timeLog(this.data.data.id.name.info+' loged on')

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
			inventory: new PlayerInDiff('inventory',function(diff){
				fn.applyDiff(this.player.inventory,diff);
				fn.applyDiff(this.player.out.inventory._data,diff)
			}),
			attack: new PlayerIn('attack',function(data){
				switch(data.type){
					case 'respawn':
						this.health = 1000;
						this.out.attack.data({
							type: 'respawn',
							health: this.health
						})
						break;
					case 'attack': 
						//find out what type of attack it is and run it
						for(var i in players.players){
							if(players.players[i].id == data.id){
								players.players[i].damage(data.health);
							}
						}
						break;
					case 'health':
						this.health = data.health;
						break;
				}
			}),
			resources: new PlayerIn('resources',function(data,cb){
				switch(data.type){
					case 'map':
						resources.getForMap(data.map,function(resr){
							//loop through the resr and build the array that the client wants
							a = [];
							for (var i = 0; i < resr.length; i++) {
								a.push({
									id: resr[i].id,
									resourceID: resr[i].currentResource,
									amount: resr[i].currentAmount,
									mined: resr[i].mined,
									position: resr[i].position,
									size: resr[i].size
								})
							};

							if(cb){
								cb(a);
							}
							else{
								this.player.out.resources.data({
									type: 'resources',
									map: data.map,
									resources: a
								})
							}
						});
						break;
					case 'mine':
						resr = resources.find(data.id)[0];
						if(resr){
							resources.resource.mine(resr,this.player);
							if(cb) cb(true);
						}
						else{
							//failed to find it
							if(cb) cb(false);
						}
						break;
				}
			}),
			disconnect: new PlayerIn('disconnect',function(data){
				console.timeLog(this.player.data.data.id.name.info+' loged off')

				this.player.exit();
			})
		}
		this.out = {
			player: new PlayerOutDiff('player'),
			players: new PlayerOutCache('players',100),
			chat: new PlayerOut('chat'),
			inventory: new PlayerOutDiff('inventory'),
			attack: new PlayerOut('attack'),
			resources: new PlayerOut('resources')
		}

		// bind socket events
		for (var val in this.in) {
			this.in[val].bind(this.socket)
		};
		for (var val in this.out) {
			this.out[val].bind(this.socket)
		};

		// set up the short hands
		this.id = this.data.data.id.id
		this.name = this.data.data.id.name

		//bind to the resources change event to we can tell the player if a resources has changed
		this.resourceListener = function(data){ //tied the function to the player obj so we can remove it later
			if(data.position.map === this.data.data.position.map){
				//send it to the client so they know this resource has changed
				this.out.resources.data({
					type: 'change',
					resource: {
						id: data.id,
						resourceID: data.currentResource,
						amount: data.currentAmount,
						mined: data.mined
					}

				})
			}
		}.bind(this);
		resources.events.on('change',this.resourceListener);

		//load the inventory
		this.inventory = [];
		db.query("SELECT inventory, health FROM users WHERE id="+this.id,function(data){
			inven = (data[0].inventory.length)? JSON.parse(data[0].inventory) : [];

			this.health = (data[0])? data[0].health : 1000;
			this.inventory = inven;
			this.out.inventory.data(inven);
			this.out.attack.data({
				type: 'health',
				health: this.health
			})
		}.bind(this))

		//send the data position/inventory to the player
		this.out.player.data(this.data.data);

		//bind error events
		this.socket.on('logError',function(err){
			db.query("SELECT id, count FROM errors WHERE app='admin' AND message="+db.ec(err.message)+" AND file="+db.ec(err.file)+" AND line="+db.ec(err.line),function(data){
				if(data.length){
					db.query('UPDATE `errors` SET `count`='+db.ec(data[0].count+1)+' WHERE id='+db.ec(data[0].id));
				}
				else{
					db.query('INSERT INTO `errors`(`message`,`app`,`file`,`line`,`stack`) VALUES('+db.ec(err.message)+','+db.ec('admin')+','+db.ec(err.file)+','+db.ec(err.line)+','+db.ec(err.stack)+')');
				}
			});
		});
	},

	update: function(){
		// send the player a list of all the players
		a = {}
		for (var i = 0; i < players.players.length; i++) {
			if(players.players[i].id !== this.id){
				if(players.players[i].data.data.position.map == this.data.data.position.map && players.players[i].data.data.position.loading == false){
					a[players.players[i].id] = players.players[i].data.toPlayerDataJSON()
					a[players.players[i].id].health = players.players[i].health;
				}
			}
		};

		this.out.players.data(a)
	},

	damage: function(health){
		this.health -= health;
		this.out.attack.data({
			type: 'damage',
			health: this.health
		})
	},

	addItem: function(itemID, amount){
		//see if its an item
		if(dataFiles.items[itemID] === undefined) return false;
		for (var i = 0; i < this.inventory.length; i++) {
			if(this.inventory[i].id === itemID){
				this.inventory[i].count += amount;
				this.out.inventory.data(this.inventory);
				return true;
			}
		};

		//if it made it this far it means we dont have it in are inventory
		this.inventory.push({
			id: itemID,
			count: amount
		})
		this.out.inventory.data(this.inventory);
		return true;
	},

	exit: function(){ //this function is called when the player obj is being removed
		//remove player from the players: array
		for (var i = 0; i < players.players.length; i++) {
			if(players.players[i].data.data.id.id == this.data.data.id.id){
				players.players.splice(i,1)
				break;
			}
		};

		//remove event listeners on resources
		resources.events.removeListener('change',this.resourceListener);

		chat.leaveAll(this)

		// save my data to the file
		this.saveDown();
	},

	saveDown: function(cb){
		//save to db
		db.player.set(this.id,this.data.data);
		db.query("UPDATE users SET inventory='"+JSON.stringify(this.inventory)+"', health="+this.health+" WHERE id="+this.id,function(data){
			if(cb) cb();
		})
	}
})

module.exports = Player;