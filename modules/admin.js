Admin = function(userData,socket){
	console.log(userData.name+' loged on as admin'.info)
	socket.userData = userData;

	socket.on('disconnect',function(){
		console.log(this.userData.name+' loged off as admin'.info)
		this.exit();
	})

	// updates
	socket.updateMaps = function(){
		maps.getMapList(function(maps){
			this.emit('mapsUpdate',maps)
		}.bind(this))
	}
	socket.updateIslands = function(){
		db.query('SELECT * FROM islands',function(data){
			this.emit('islandsUpdate',data)
		}.bind(this))
	}
	socket.updateUsers = function(){
		db.query('SELECT * FROM users LIMIT '+db.ec(this.usersSelectLimit.min)+', '+db.ec(this.usersSelectLimit.max),function(data){
			this.emit('usersUpdate',data)
		}.bind(this))
	}

	// maps
	socket.on('createMap',function(data,cb){ //needs a function on the map obj
		maps.createMap(data,function(m){
			this.updateMaps()
			if(cb) cb(true);
		}.bind(this))
		// db.query("INSERT INTO `maps`(`name`, `desc`, `island`, `width`, `height`) VALUES ("+db.ec(data.name)+", "+db.ec(data.desc)+", "+db.ec(data.island)+", "+db.ec(data.width)+", "+db.ec(data.height)+")",function(data){
		// 	db.query('SELECT * FROM maps',function(data){
		// 		socket.emit('mapsUpdate',data)
		// 	})
		// 	cb(true);
		// })
	})
	socket.on('deleteMap',function(mapID,cb){
		maps.deleteMap(mapID,function(){
			this.updateMaps();
			if(cb) cb();
		}.bind(this));
		// db.query('DELETE FROM `maps` WHERE id='+db.ec(mapID),function(data){
		// 	if(data.affectedRows !== 0){
		// 		maps.removeMap(mapID);
		// 	}
		// 	cb(data.affectedRows !== 0);
		// })
	})
	socket.on('editMapInfo',function(data,cb){
		id = data.id;
		delete data.id;
		maps.updateMap(id,data,function(){
			if(cb) cb();
		});
		// maps.getMap(data.id,function(map){
		// 	map.desc = data.desc;
		// 	map.island = data.island;
		// 	map.name = data.name;
		// 	map.saved = false;
		// 	//fire the change event
		// 	maps.updateMapList();
		// 	if(cb) cb(true);
		// }.bind(this))
		// db.query("UPDATE `maps` SET `name`="+db.ec(data.name)+", `desc`="+db.ec(data.desc)+", `island`="+db.ec(data.island)+" WHERE id="+db.ec(data.id),function(data){
		// 	db.query('SELECT * FROM maps',function(data){
		// 		socket.emit('mapsUpdate',data)
		// 	})
		// 	cb(true);
		// })
	})
	socket.on('getChunk',function(data,cb){
		maps.getChunk(data.x,data.y,data.map,function(chunk){
			if(cb) cb(chunk.tiles);
		})
		// db.query('SELECT data FROM chunks WHERE map='+db.ec(data.map)+' AND x='+db.ec(data.x)+' AND y='+db.ec(data.y),function(data){
		// 	if(data.length){
		// 		cb(data);
		// 	}
		// 	else{
		// 		cb(false);
		// 	}
		// })
	})
	socket.on('updateLayers',function(data,cb){
		//cant combindIn because dose not take into account removed array indexes
		maps.getMap(data.map,function(map){
			map.layers = data.layers;
			map.saved = false;
			maps.events.emit('mapsChange')
			if(cb) cb();
		})
		// maps.getMap(data.map,function(map){
		// 	map.layers = data.layers;
		// 	if(cb) cb(true);
		// })
		// db.query('UPDATE `maps` SET `layers`='+db.ec(JSON.stringify(data.layers))+' WHERE id='+db.ec(data.map),function(data){
		// 	if(cb) cb(data.affectedRows !== 0);
		// })
	})

	// users
	socket.usersSelectLimit = {
		min: 0,
		max: 10
	};
	socket.on('usersChangeLimit',function(limit,cb){
		this.usersSelectLimit.min = limit.from;
		this.usersSelectLimit.max = limit.to;
		this.updateUsers();
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

	maps.events.on('mapsChange',socket.updateMaps.bind(socket));
	socket.updateIslands();
	socket.updateMaps();
	socket.updateUsers();

	//live events, these are not stored in the db but sent to the other admins loged in
	socket.on('liveTileChange',function(data,cb){

	})

	socket.exit = function(){
		//remove event listeners
		maps.events.removeListener('mapsChange',this.updateMaps)
		//remove myself from admin list
		for (var i = 0; i < players.admins.length; i++) {
			if(players.admins[i].userData.id == this.userData.id){
				players.admins.splice(i,1)
				break;
			}
		};
	}

	return socket;
}

//export
module.exports = Admin;