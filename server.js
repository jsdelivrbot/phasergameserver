// libraries
Klass = require('Klass');
fn = require('./modules/functions.js');
fs = require('fs');
readline = require('readline');
JSPath = require('jspath');
_ = require('underscore');
colors = require('colors');
players = require('./modules/players.js');
chat = require('./modules/chatChanels.js');
dataServer = require('./modules/dataServer.js');
db = require('./modules/db.js');

//set the log colors
colors.setTheme({
	info: 'cyan',
	warn: 'yellow',
	error: 'red'
});

//set the files
CONFIG = {};

//load the files
start = _.after(1,init)
fs.readFile('config.json', function (err, data) {
  	if (err) throw err;
  	console.log('loaded config');

  	CONFIG = JSON.parse(data);

  	start();
})

function init(){
	//start
	db.init();
	dataServer.init();
	players.init()

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
}