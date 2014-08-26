player = require('./player.js')
data = require('./data.js')

module.exports = {
	players: [],
	users: data.get('users.json').data,
	step: null,

	__init__: function(){
		this.step = setInterval(this.update,100,this)
	},

	login: function(email,password,socket){
		for (var i = 0; i < this.users.length; i++) {
			if(email === this.users[i].id.email && password === this.users[i].id.password){
				_player = new player(this.users[i],socket)
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
}