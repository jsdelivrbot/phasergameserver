sql = require('mysql');

db = {
	db: {},
	timeout: null,
	connecting: false,
	init: function(){
		this.connect()
	},
	query: function(sql,cb){
		if(db.db.state === 'authenticated'){
			db.db.query(sql,function(err, rows, fields){
				if(err) throw err;
				if(cb){
					cb(rows);
				}
			})

			//refresh the time out
			clearTimeout(db.timeout);
			db.timeout = setTimeout(function(){
				console.log('no database activity, closing '.info+'connection')
				db.disconect()
			},1000*60)
		}
		else{
			//connect and query
			db.connect(function(){
				db.db.query(sql,function(err, rows, fields){
					if(err) throw err;
					if(cb){
						cb(rows);
					}
				})
			})
		}
	},
	ec: function(str){
		if(this.db){
			return this.db.escape(str);
		}
	},
	connect: function(cb){
		cb = cb || function(){};
		//see if we are trying to connect, if so add the cb to the existing connection
		if(db.connecting){
			db.db.once('connect',cb);
			return;
		}

		db.db = sql.createConnection({
			host: dataFiles.config.dataBase.host,
			user: dataFiles.config.dataBase.user,
			password: dataFiles.config.dataBase.password,
			database: dataFiles.config.dataBase.dataBase
		});
		db.connecting = true;
		db.db.connect(function(err){
			if(err){
				console.log('failed to connect to the data base'.error);
				process.exit();
			}
			console.log('connected'.info+' to the data base');
			db.connecting = false;
			cb();
		});

		db.timeout = setTimeout(function(){
			console.log('no database activity'.info+', closing connection')
			db.disconect()
		},1000*60)
	},
	disconect: function(cb){
		if(db.db.state === 'authenticated'){
			db.db.end();
		}
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
							name: data.name
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
							name: data.name
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
}

//export
module.exports = db;