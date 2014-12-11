sql = require('mysql');

db = {
	db: null,
	connected: false,
	timeout: null,
	init: function(){
		this.connect()
	},
	query: function(sql,cb){
		if(db.connected){
			db.db.query(sql,function(err, rows, fields){
				if(err) throw err;
				if(cb){
					cb(rows);
				}
			})

			//refresh the time out
			clearTimeout(db.timeout);
			db.timeout = setTimeout(function(){
				console.log('no database activity, closing connection'.info)
				db.disconect()
			},1000*60*10)
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
	connect: function(cb){
		cb = cb || function(){};
		this.db = sql.createConnection({
			host: CONFIG.dataBase.host,
			user: CONFIG.dataBase.user,
			password: CONFIG.dataBase.password,
			database: CONFIG.dataBase.dataBase
		});
		this.db.connect(function(err){
			if(err){
				console.log('failed to connect to the data base');
				throw err;
			}
			db.connected = true;
			console.log('connected to the data base');
			cb();
		});

		db.timeout = setTimeout(function(){
			console.log('no database activity, closing connection'.info)
			db.disconect()
		},1000*60*10)
	},
	disconect: function(cb){
		if(db.connected){
			db.db.close();
			db.connected = false;
		}
	},
	player: {
		get: function(id,cb){
			//get the players data and build a playerDataFull out of it
			db.query('SELECT * FROM users WHERE id='+id, function(data){
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
			db.query("SELECT * FROM users WHERE email='"+email+"'", function(data){
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