// server
Klass = require('Klass')
fn = require('./modules/functions.js')
fs = require('fs')
readline = require('readline')
JSPath = require('jspath')
_ = require('underscore')
// repl = require("repl")

// Commands = require('./modules/commands.js')
Players = require('./modules/players.js')
Player = require('./modules/player.js')
ChatChanels = require('./modules/chatChanels.js')
DataFile = require('./modules/dataFile.js')
DataFiles = require('./modules/dataFiles.js')

io = require('socket.io')(8181);

dataFiles = new DataFiles()
dataFiles.load('users.json',true)

// commands = new Commands()
players = new Players()
chat = new ChatChanels()

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

// repl.start("> ")