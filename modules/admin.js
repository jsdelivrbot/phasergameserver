Admin = function(userData,socket){
	console.timeLog(userData.name.info+' loged on as admin')
	socket.userData = userData;

	socket.on('disconnect',function(){
		console.timeLog(this.userData.name.info+' loged off as admin')
		this.exit();
	})

	// updates
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
	socket.on('createMap',function(data,cb){
		map = new maps.Map(-1);
		map.name = data.name;
		map.desc = data.desc;
		map.width = data.width;
		map.height = data.height;
		map.island = data.island;
		maps.insertMap(map,function(m){
			if(cb) cb(true);
			//tell every one that the maps have changed
			maps.getMapList(function(maps){
				io.emit('mapsChange',maps);
			}.bind(this))
		}.bind(this))
	})
	socket.on('deleteMap',function(mapID,cb){
		maps.deleteMap(mapID,function(){
			if(cb) cb();
			//tell every one that the maps have changed
			maps.getMapList(function(maps){
				io.emit('mapsChange',maps);
			}.bind(this))
		}.bind(this));
	})
	socket.on('editMapInfo',function(data,cb){
		maps.getMap(data.id,function(map){
			map.name = data.name;
			map.desc = data.desc;
			map.width = data.width;
			map.height = data.height;
			map.island = data.island;
			map.saved = false;
			//tell every one that the maps have changed
			maps.getMapList(function(maps){
				io.emit('mapsChange',maps);
			}.bind(this))
		})
	})
	socket.on('getChunk',function(data,cb){
		maps.getChunk(data.x,data.y,data.map,function(chunk){
			if(cb) cb(chunk.exportData());
		})
	})
	socket.on('updateLayers',function(data,cb){
		//cant combindIn because dose not take into account removed array indexes
		maps.getMap(data.map,function(map){
			map.layers = data.layers;
			map.saved = false;
			if(cb) cb();
			//tell every one that the maps have changed
			maps.getMapList(function(maps){
				io.emit('mapsChange',maps);
			}.bind(this))
		})
	})
	socket.on('tileChange',function(data,cb){
		maps.setTile(data,cb);
	})
	socket.on('tilesChange',function(data,cb){
		maps.setTiles(data,data.map,cb);
	})

	//objects
	socket.on('getObject',function(data,cb){
		objectController.getObject(data.id,data.type,function(obj){
			obj = obj.exportData();
			if(cb) cb(obj);
		})
	})
	socket.on('getObjects',function(data,cb){
		objectController.getObjectsOnPosition(data.type,data.from,data.to,function(objs){
			for (var i = 0; i < objs.length; i++) {
				objs[i] = objs[i].exportData();
			};
			if(cb) cb(objs);
		}.bind(this))
	})
	socket.on('objectCreate',function(data,cb){
		objectController.createObject(data.type,data.data,function(obj){
			obj = obj.exportData();
			if(cb) cb(obj);
		})
	})
	socket.on('objectChange',function(data,cb){ // data is a array of changed objs
		objectController.updateObject(data.id,data.type,data,cb);
	})
	socket.on('objectDelete',function(data,cb){
		objectController.deleteObject(data.id,data.type,cb);
	})

	//templates
	socket.on('getTemplate',function(data,cb){
		templates.getTemplate(data.id,function(template){
			template = template.exportData();
			if(cb) cb(template);
		})
	})
	socket.on('getTemplates',function(cb){
		templates.getTemplates(cb);
	})
	socket.on('TemplateCreate',function(data,cb){
		templates.createTemplate(data.data,function(template){
			template = template.exportData();
			if(cb) cb(template);
		})
	})
	socket.on('TemplateChange',function(data,cb){
		templates.updateTemplate(data.id,data,cb);
	})
	socket.on('TemplateDelete',function(id,cb){
		templates.deleteTemplate(id,cb);
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

	socket.updateIslands();
	socket.updateUsers();
	maps.getMapList(function(maps){
		this.emit('mapsChange',maps);
	}.bind(socket))

	socket.exit = function(){
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