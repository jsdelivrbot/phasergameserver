// server
Class = require('classyjs')
fn = require('./modules/functions.js')

PlayerData = require('./modules/playerData.js')
Players = require('./modules/players.js')
Player = require('./modules/player.js')

io = require('socket.io')(8181);
dataFiles = require('./modules/dataFiles.js')
dataFiles.load('users.json')
dataFiles.load('maps/maps.json')
players = new Players()

io.on('connection', function (socket) {
	socket.on('login', function (data,collback) {
		collback(players.login(data.email,data.password,socket))
	});
});