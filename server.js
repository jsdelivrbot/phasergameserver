// server
Klass = require('Klass')
fn = require('./modules/functions.js')
readline = require('readline')
JSPath = require('jspath')
_ = require('underscore')

players = require('./modules/players.js')
chat = require('./modules/chatChanels.js')
dataServer = require('./modules/dataServer.js')
db = require('./modules/db.js');


io = require('socket.io')(8181);
io.on('connection', function (socket) {
	socket.on('login', function (data,collback) {
		players.login(data.email,data.password,socket,function(_player){
			if(_player !== false){
				collback(true)

				// join the genral chanel
				chat.join('0',_player)
			}
			else{
				collback(false)
			}
		});
	});
});