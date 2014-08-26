Io = require('socket.io')(25565);
Data = require('./modules/data.js')
Data.load('users.json')
Data.load('maps/maps.json')
Maps = require('./modules/maps.js')()
Players = require('./modules/players.js')

Io.on('connection', function (socket) {
	socket.on('login', function (data,collback) {
		collback(Players.login(data.email,data.password,socket))
	});
});