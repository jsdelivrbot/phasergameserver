// server
Klass = require('Klass')
fn = require('./modules/functions.js')

Players = require('./modules/players.js')
Player = require('./modules/player.js')
ChatChanels = require('./modules/chatChanels.js')

io = require('socket.io')(8181);
dataFiles = require('./modules/dataFiles.js')
dataFiles.load('users.json')

players = new Players()
chat = new ChatChanels()

io.on('connection', function (socket) {
	socket.on('login', function (data,collback) {
		collback(players.login(data.email,data.password,socket))
	});
});