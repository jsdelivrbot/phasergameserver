// libraries
Klass = require('Klass');
fn = require('./modules/functions.js');
fs = require('fs');
readline = require('readline');
_ = require('underscore');
colors = require('colors');
admin = require('./modules/admin.js');
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
	db.init();
	dataServer.init();
	players.init()

	io = require('socket.io')(8181);
	io.on('connection', function (socket) {
		socket.on('login', function (data,callback) {
			players.login(data.email,data.password,socket,function(_player){
				if(_player !== false){
					callback(true)

					// join the genral chanel
					chat.join('0',_player)
				}
				else{
					callback(false)
				}
			});
		});
		socket.on('adminLogin', function (data,callback) {
			//login and see if he is an admin
			db.query("SELECT * FROM users WHERE admin=1 AND email="+db.ec(data.email)+' AND password='+db.ec(data.password),function(data){
				if(data.length){
					admin(socket,data[0])
					callback(true);
				}
				else{
					callback(false);
				}
			})
		});
	});
}