var io = require('socket.io')(8080);
var data = require('./modules/data.js')
var maps = require('./modules/maps.js')(data)

io.on('connection', function (socket) {
	socket.on('login', function (data) {
		console.log(data);
	});
});