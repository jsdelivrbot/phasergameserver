module.exports = Class.$extend({
	players: [],
	users: [],
	step: null,

	__init__: function(){
		this.users = dataFiles.get('users.json').data
		this.step = setInterval(this.update,100,this)
	},

	login: function(email,password,socket){
		for (var i = 0; i < this.users.length; i++) {
			if(email === this.users[i].id.email && password === this.users[i].id.password){
				_player = new Player(this.users[i],socket)
				this.players.push(_player)
				return true;
			}
		};
		return false;
	},

	update: function(_this){
		// send down the data
		for (var i = 0; i < _this.players.length; i++) {
			_this.players[i].update()
		};
	}
})