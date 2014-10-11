Chanel = Klass({
	data: {
		id: '',
		title: '',
		canLeave: true,
		owner: -1,
	},
	id: '',
	messages: [],
	players: [], //array of player objects
	initialize: function(data){
		this.data = fn.duplicate(this.data)
		this.data = fn.combindOver(this.data,data)

		this.players = fn.duplicate(this.players)
		this.messages = fn.duplicate(this.messages)

		return this.data.id
	},
	message: function(message,player){
		for (var i = 0; i < this.players.length; i++) {
			this.players[i].out.chat.data({
				type: 'message',
				chanel: this.data.id,
 	 			player: {
 	 				id: player.data.data.id.id,
 	 				name: player.data.data.id.name
 	 			},
 	 			message: message
			})
		};
	},
	join: function(player){
		// add him to the list
		this.players.push(player)

		// tell the player he joined
		_players = []
		for (var i = 0; i < this.players.length; i++) {
			_players.push({
				id: this.players[i].data.data.id.id,
				name: this.players[i].data.data.id.name
			})
		};
		player.out.chat.data({
			type: 'you joined',
			chanel: this.data,
			players: _players
		})

		// tell all the other players that he joined
		for (var i = 0; i < this.players.length; i++) {
			if(this.players[i].data.data.id.id != player.data.data.id.id){
				this.players[i].out.chat.data({
					type: 'joined',
					chanel: this.data.id,
			 		player: {id: player.data.data.id.id, name: player.data.data.id.name}
				})
			}
		};
	},
	leave: function(player){
		// tell the player he left
		player.out.chat.data({
			type: 'you left',
			chanel: this.data.id
		})
		for (var i = 0; i < this.players.length; i++) {
			if(this.players[i].data.data.id.id == player.data.data.id.id){
				this.players.splice(i,1)
				break;
			}
		};

		if(player.data.data.id.id == this.data.owner){
			this.close()
			return;
		}

		// tell the other players that he left
		for (var i = 0; i < this.players.length; i++) {
			this.players[i].out.chat.data({
				type: 'left',
				chanel: this.data.id,
 	 			player: player.data.data.id.id
			})
		};
	},
	close: function(){
		// tell all the other players that its closed
		for (var i = 0; i < this.players.length; i++) {
			this.players[i].out.chat.data({
				type: 'closed',
				chanel: this.data.id
			})
		};
	}
})

module.exports = Klass({
	lastID: 0,
	chanels: {},
	initialize: function(){
		// create the genral chanel
		this.createChanel({title: 'Genral', canLeave: false})
	},
	createChanel: function(data){
		_id = this.lastID.toString()
		_data = fn.combindOver({id:_id},data)

		this.chanels[_id] = new Chanel(_data)
		this.lastID++

		return _id
	},
	message: function(chanelID,message,player){
		// see if the player is in the chanel
		if(this.chanels[chanelID]){
			this.chanels[chanelID].message(message,player)
		}
	},
	join: function(chanelID,player){
		if(this.chanels[chanelID]){
			this.chanels[chanelID].join(player)
		}
	},
	leave: function(chanelID,player){
		if(this.chanels[chanelID]){
			this.chanels[chanelID].leave(player)
		}
	},
	leaveAll: function(player){
		for (var i in this.chanels) {
			this.chanels[i].leave(player)
		};
	}
})