module.exports = Klass({
	players: [],
	users: [],
	step: null,

	initialize: function(){
		this.users = dataFiles.get('users.json').data
		this.step = setInterval(this.update,100,this)
	},

	login: function(email,password,socket){
		for (var i = 0; i < this.users.length; i++) {
			if(email === this.users[i].id.email && password === this.users[i].id.password){
				for (var j = 0; j < this.players.length; j++) {
					if(this.users[i].id.id == this.players[j].id){
						return false;
					}
				};

				_player = new Player(this.users[i],socket)
				this.players.push(_player)

				// return the playerData object
				return _player;
			}
		};
		return false;
	},

	update: function(_this){
		// send down the data
		for (var i = 0; i < _this.players.length; i++) {
			_this.players[i].update()
		};
	},

	saveDownAll: function(){
		for (var i = 0; i < this.players.length; i++) {
			this.players[i].saveDown()
		};
	}
})