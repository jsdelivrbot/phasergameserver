admin = function(socket,playerData){
	console.log(playerData.name+' loged on as admin'.info)
	socket.playerData = playerData;

	socket.on('disconnect',function(){
		console.log(this.playerData.name+' loged off as admin'.info)
	})

	// maps
	socket.on('createMap',function(data,cb){
		db.query("INSERT INTO `maps`(`name`, `desc`, `island`) VALUES ("+db.ec(data.name)+", "+db.ec(data.desc)+", "+db.ec(data.island)+")",function(data){
			db.query('SELECT * FROM maps',function(data){
				socket.emit('mapsUpdate',data)
			})
			cb(true);
		})
	})
	socket.on('deleteMap',function(mapID,cb){
		db.query('DELETE FROM `maps` WHERE id='+db.ec(mapID),function(data){
			cb(data.affectedRows !== 0);
		})
	})
	socket.on('editMapInfo',function(data,cb){
		db.query("UPDATE `maps` SET `name`="+db.ec(data.name)+", `desc`="+db.ec(data.desc)+", `island`="+db.ec(data.island)+" WHERE id="+db.ec(data.id),function(data){
			db.query('SELECT * FROM maps',function(data){
				socket.emit('mapsUpdate',data)
			})
			cb(true);
		})
	})

	socket.on('users',function(select,cb){
		db.query('SELECT * FROM users LIMIT '+db.ec(select.from)+', '+db.ec(select.to),function(data){
			cb(data);
		})
	})
	socket.on('deleteUser',function(userID,cb){
		db.query('DELETE FROM `users` WHERE id='+db.ec(userID),function(data){
			cb(data.affectedRows !== 0);
		})
	})
	socket.on('usersAdmin',function(data,cb){
		db.query('UPDATE `users` SET `admin`='+db.ec(data.admin)+' WHERE id='+db.ec(data.id),function(data){
			cb(data.affectedRows !== 0);
		})
	})
	socket.on('usersBanned',function(data,cb){
		db.query('UPDATE `users` SET `banned`='+db.ec(data.banned)+' WHERE id='+db.ec(data.id),function(data){
			cb(data.affectedRows !== 0);
		})
	})
	socket.on('createUser',function(userData,cb){
		db.query("INSERT INTO `users`(`name`, `email`, `password`) VALUES ("+db.ec(userData.name)+", "+db.ec(userData.email)+", "+db.ec(userData.password)+")",function(data){
			db.query('SELECT * FROM users LIMIT 0, 10',function(data){ //might run into problems, need to send back the page, or sync what page im on with the client
				socket.emit('usersUpdate',data)
			})
			cb(true);
		})
	})

	db.query('SELECT * FROM islands',function(data){
		socket.emit('islandsUpdate',data)
	})

	db.query('SELECT * FROM maps',function(data){
		socket.emit('mapsUpdate',data)
	})

	db.query('SELECT * FROM users LIMIT 0, 10',function(data){
		socket.emit('usersUpdate',data)
	})
}

//export
module.exports = admin;