// server
Klass = require('Klass')
fn = require('./modules/functions.js')
readline = require('readline')
JSPath = require('jspath')
_ = require('underscore')

players = require('./modules/players.js')
chat = require('./modules/chatChanels.js')
dataServer = require('./modules/dataServer.js')


io = require('socket.io')(8181);
io.on('connection', function (socket) {
	socket.on('login', function (data,collback) {
		_player = players.login(data.email,data.password,socket);
		if(_player !== false){
			_player.out.player.data(_player.data.data);

			collback(true)

			// join the genral chanel
			chat.join('0',_player)
		}
		else{
			collback(false)
		}
	});
});