// libraries
fn = require('./modules/functions.js');
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
commands = require('./modules/commands.js');
objectController = require('./modules/objectController.js');

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
		commands.init();
		objectController.init();

		io = require('socket.io')(8181);
		io.on('connection', function (socket) {
			socket.on('login', function (data,callback) {
				players.login(data.email,data.password,socket,function(loginMessage,_player){
					if(loginMessage.success){
						// join the genral chanel
						chat.join('0',_player)
					}
					callback(loginMessage)
				});
			});
			socket.on('adminLogin', function (data,callback) {
				//login and see if he is an admin
				players.adminLogin(data.email,data.password,socket,function(loginMessage,_admin){
					callback(loginMessage);
				})
			});
		});
	});
}

//log
console.__proto__.timeLog = function(){
	var args = Array.prototype.slice.call(arguments);
	d = new Date();
	args.splice(0,0,'['+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()+']');
	console.log.apply(console,args);
}