// server
Klass = require('Klass')
fn = require('./modules/functions.js')
fs = require('fs')

Players = require('./modules/players.js')
Player = require('./modules/player.js')
ChatChanels = require('./modules/chatChanels.js')
DataFile = require('./modules/dataFile.js')
DataFiles = require('./modules/dataFiles.js')

io = require('socket.io')(8181);

dataFiles = new DataFiles()
dataFiles.load('users.json',true)

players = new Players()
chat = new ChatChanels()

io.on('connection', function (socket) {
	socket.on('login', function (data,collback) {
		collback(players.login(data.email,data.password,socket))
	});
});