// libraries
Klass = require('Klass');
fn = require('./modules/functions.js');
fs = require('fs');
readline = require('readline');
_ = require('underscore');
colors = require('colors');
Admin = require('./modules/admin.js');
maps = require('./modules/maps.js');
players = require('./modules/players.js');
chat = require('./modules/chatChanels.js');
dataServer = require('./modules/dataServer.js');
db = require('./modules/db.js');
dataFiles = require('./modules/dataFiles.js');
resources = require('./modules/resources.js');

//set the log colors
colors.setTheme({
	info: 'cyan',
	warn: 'yellow',
	error: 'red'
});

//load the dataFiles
dataFiles.load(init);

function init(){
	//start
	db.init(function(){
		dataServer.init();
		players.init();
		maps.init();

		io = require('socket.io')(8181);
		io.on('connection', function (socket) {
			socket.on('login', function (data,callback) {
				players.login(data.email,data.password,socket,function(loginCode,_player){
					if(loginCode == 0){
						// join the genral chanel
						chat.join('0',_player)
					}
					callback(loginCode)
				});
			});
			socket.on('adminLogin', function (data,callback) {
				//login and see if he is an admin
				players.adminLogin(data.email,data.password,socket,function(loginCode,_admin){
					callback(loginCode);
				})
			});
		});
	});
}