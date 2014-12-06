sql = require('mysql');

db = {
	db: null,
	init: function(){
		this.db = sql.createConnection({
			host: 'localhost',
			user: 'root',
			password: 'bionicle13',
			database: 'phasergame'
		});
		this.db.connect(function(err){
			if(err){
				throw err;
			}
			console.log('connected to the data base');
		});
	},
	query: function(sql,cb){
		if(db.db){
			db.db.query(sql,function(err, rows, fields){
				if(err) throw err;
				if(cb){
					cb.bind(fields)(rows); //in cb "this" is the fields
				}
			})
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
							island: data.island,
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
							island: data.island,
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
			db.query("UPDATE users SET email='"+data.id.email+"', password='"+data.id.password+"', name='"+data.id.name+"', x="+Math.round(data.position.body.x)+", y="+Math.round(data.position.body.y)+", island="+data.position.island+", map="+data.position.map+", image='"+data.sprite.image+"' WHERE id="+id)
		}
	}
}
db.init();

//export
module.exports = db;