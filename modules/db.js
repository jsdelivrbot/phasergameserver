var sqlDB = require('mysql');
var events = require('events');

db = {
	db: {},
	timeout: null,
	connecting: false,
	events: new events.EventEmitter(),
	/*
	connect
	disconnect
	*/
	init: function(cb){
		this.events.setMaxListeners(1000);
		this.connect(cb)
	},
	query: function(sql,cb){
		if(db.db.state === 'authenticated'){
			db.db.query(sql,function(err, rows, fields){
				if(fields){
					for (var i = 0; i < fields.length; i++) {
						if(fields[i].type == 1){
							for (var k = 0; k < rows.length; k++) {
								rows[k][fields[i].name] = !!rows[k][fields[i].name];
							};
						}
					};
				}
				if(err) throw err;
				if(cb) cb(rows);
			});

			//refresh the time out
			this.setDisconenctTimer();
		}
		else{
			//connect and query
			db.connect(function(){
				db.db.query(sql,function(err, rows, fields){
					if(fields){
						for (var i = 0; i < fields.length; i++) {
							if(fields[i].type == 1){
								for (var k = 0; k < rows.length; k++) {
									rows[k][fields[i].name] = !!rows[k][fields[i].name];
								};
							}
						};
					}
					if(err) throw err;
					if(cb) cb(rows);
				})
			})
		}
	},
	ec: function(str){
		if(this.db){
			if(typeof str == 'object'){
				str = JSON.stringify(str);
			}
			return this.db.escape(str);
		}
	},
	ecID: function(str){
		if(this.db){
			return this.db.escapeId(str);
		}
	},
	connect: function(cb){
		cb = cb || function(){};
		//see if we are trying to connect, if so add the cb to the existing connection
		if(this.connecting){
			this.events.once('connect',cb);
			return;
		}

		this.db = sqlDB.createConnection({
			host: dataFiles.config.dataBase.host,
			user: dataFiles.config.dataBase.user,
			password: dataFiles.config.dataBase.password,
			database: dataFiles.config.dataBase.dataBase,
			insecureAuth: dataFiles.config.dataBase.insecureAuth
		});
		this.connecting = true;
		this.db.connect(function(err){
			if(err){
				console.timeLog('failed to connect to the data base'.error);
				process.exit();
			}
			db.connecting = false;
			this.events.emit('connect');
			cb();
		}.bind(this));

		this.setDisconenctTimer();
	},
	disconnect: function(cb){
		if(db.db.state === 'authenticated'){
			db.db.end(function(){
				this.events.emit('disconnect');
				if(cb) cb();
			}.bind(this));
		}
	},
	reconnect: function(cb){ //somthing for code to go through to reduce the number of connect events
		if(this.db.state === 'authenticated'){
			if(cb) cb();
		}
		else{
			this.connect(cb || function(){});
		}
	},
	setDisconenctTimer: function(){
		clearTimeout(this.timeout);
		this.timeout = setTimeout(function(){
			this.disconnect()
		}.bind(this),1000*60)
	},
	player: {
		get: function(id,cb){
			//get the players data and build a playerDataFull out of it
			db.query('SELECT * FROM users WHERE id='+db.ec(id), function(data){
				if(data.length){
					cb({
						id: {
							id: data.id,
							email: data.email,
							password: data.pass,
							name: data.name,
							admin: data.admin
						},
						position:{
							body:{
								x: data.x,
								y: data.y
							},
							map: data.map
						},
						sprite: {
							image: data.image
						}
					});
				}
				else{
					cb(false)
				}
			})
		},
		getFromEmail: function(email,cb){
			//get the players data and build a playerDataFull out of it
			db.query("SELECT * FROM users WHERE email="+db.ec(email), function(data){
				if(data.length){
					data = data[0];
					cb({
						id: {
							id: data.id,
							email: data.email,
							password: data.password,
							name: data.name,
							admin: data.admin,
							banned: data.banned
						},
						position:{
							body:{
								x: data.x,
								y: data.y
							},
							map: data.map
						},
						sprite: {
							image: data.image
						}
					});
				}
				else{
					cb(false)
				}
			})
		},
		set: function(id,data){
			//parse the player data into sql
			db.query("UPDATE users SET email='"+data.id.email+"', password='"+data.id.password+"', name='"+data.id.name+"', x="+Math.round(data.position.body.x)+", y="+Math.round(data.position.body.y)+", map="+data.position.map+", image='"+data.sprite.image+"' WHERE id="+id)
		}
	}
};

//export
module.exports = db;