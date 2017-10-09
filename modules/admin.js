Admin = function(userData,socket){
	console.timeLog(userData.name.info+' loged on as admin');
	socket.userData = userData;

	socket.on('disconnect',function(){
		chat.leaveAll(this);
		console.timeLog(this.userData.name.info+' loged off as admin');
		this.exit();
	});

	// updates
	socket.updateUsers = function(){
		db.query('SELECT * FROM users LIMIT '+db.ec(this.usersSelectLimit.min)+', '+db.ec(this.usersSelectLimit.max),function(data){
			this.emit('usersUpdate',data)
		}.bind(this))
	};
	socket.updateErrors = function(){
		db.query('SELECT * FROM errors LIMIT '+db.ec(this.errorsPage*10)+', '+db.ec((this.errorsPage*10)+10),function(data){
			this.emit('updateErrors',data)
		}.bind(this))
	};

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
	});
	socket.on('deleteMap',function(mapID,cb){
		maps.deleteMap(mapID,function(){
			if(cb) cb();
			//tell every one that the maps have changed
			maps.getMapList(function(maps){
				io.emit('mapsChange',maps);
			}.bind(this))
		}.bind(this));
	});
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
	});
	socket.on('getChunk',function(data,cb){
		maps.getChunk(data.x,data.y,data.map,function(chunk){
			if(cb) cb(chunk.exportData());
		})
	});
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
	});
	socket.on('tilesChange',function(data,cb){
		maps.setTiles(data,cb);
	});

	//layers
	socket.on('createLayer',function(data,cb){
		maps.createLayer(data,cb);
	});
	socket.on('deleteLayer',function(id,cb){
		maps.deleteLayer(id,cb);
	});
	socket.on('changeLayer',function(data,cb){
		maps.changeLayer(data,cb);
	});
	socket.emit('updateLayers',maps.layers);

	//objects
	socket.on('getObject',function(data,cb){
		objectController.getObject(data.id,data.type,function(obj){
			obj = obj.exportData();
			if(cb) cb(obj);
		})
	});
	socket.on('getObjects',function(data,cb){
		objectController.getObjectsOnPosition(data.type,data.from,data.to,function(objs){
			for (var i = 0; i < objs.length; i++) {
				objs[i] = objs[i].exportData();
			};
			if(cb) cb(objs);
		}.bind(this))
	});
	socket.on('objectCreate',function(data,cb){
		objectController.createObject(data.type,data.data,function(obj){
			obj = obj.exportData();
			if(cb) cb(obj);
		})
	});
	socket.on('objectChange',function(data,cb){ // data is a array of changed objs
		objectController.updateObject(data.id,data.type,data,cb);
	});
	socket.on('objectDelete',function(data,cb){
		objectController.deleteObject(data.id,data.type,cb);
	});

	//templates
	socket.on('getTemplate',function(data,cb){
		templates.getTemplate(data.id,function(template){
			template = template.exportData();
			if(cb) cb(template);
		})
	});
	socket.on('getTemplates',function(cb){
		templates.getTemplates(function(data){
			for (var i = 0; i < data.length; i++) {
				data[i] = data[i].exportData();
			};
			if(cb) cb(data);
		});
	});
	socket.on('templateCreate',function(data,cb){
		templates.createTemplate(data,function(){
			if(cb) cb();
		})
	});
	socket.on('templateChange',function(data,cb){
		templates.updateTemplate(data.id,data,cb);
	});
	socket.on('templateDelete',function(id,cb){
		templates.deleteTemplate(id,cb);
	});

	//tileProperties
	socket.on('tilePropertiesChange',function(data){
		maps.tilePropertiesChange(data);
	});

	// users
	socket.usersSelectLimit = {
		min: 0,
		max: 10
	};
	socket.on('usersChangeLimit',function(limit,cb){
		this.usersSelectLimit.min = limit.from;
		this.usersSelectLimit.max = limit.to;
		this.updateUsers();
	});
	socket.on('deleteUser',function(userID,cb){
		db.query('DELETE FROM `users` WHERE id='+db.ec(userID),function(data){
			cb(data.affectedRows !== 0);
		})
	});
	socket.on('usersAdmin',function(data,cb){
		db.query('UPDATE `users` SET `admin`='+db.ec(data.admin)+' WHERE id='+db.ec(data.id),function(data){
			cb(data.affectedRows !== 0);
		})
	});
	socket.on('usersBanned',function(data,cb){
		db.query('UPDATE `users` SET `banned`='+db.ec(data.banned)+' WHERE id='+db.ec(data.id),function(data){
			cb(data.affectedRows !== 0);
		})
	});
	socket.on('createUser',function(userData,cb){
		db.query("INSERT INTO `users`(`name`, `email`, `password`) VALUES ("+db.ec(userData.name)+", "+db.ec(userData.email)+", "+db.ec(userData.password)+")",function(data){
			db.query('SELECT * FROM users LIMIT 0, 10',function(data){ //might run into problems, need to send back the page, or sync what page im on with the client
				socket.emit('usersUpdate',data)
			});
			cb(true);
		})
	});

	//chat
	if(socket.userData.admin) chat.join('Server',socket);
	// chat.joinDefault(socket)
	socket.on('chatChanelMessage',function(data){
		chat.message(data.chanel,data.message);
	});
	socket.on('chatChanelLeave',function(data){
		chat.leave(data.chanel,this);
	});

	//errors
	socket.errorsPage = 0;
	socket.on('errorsChangePage',function(page){
		this.page = page;
		this.updateErrors();
	});
	socket.on('errorsDelete',function(id){
		db.query('DELETE FROM `errors` WHERE id='+db.ec(id),function(){
			this.updateErrors();
		}.bind(this))
	});
	socket.on('errorsDeleteAll',function(id){
		db.query('TRUNCATE TABLE `errors`',function(){
			this.updateErrors();
		}.bind(this))
	});
	socket.updateErrors();

	socket.on('logError',function(err){
		db.query("SELECT id, count FROM errors WHERE app='admin' AND message="+db.ec(err.message)+" AND file="+db.ec(err.file)+" AND line="+db.ec(err.line),function(data){
			if(data.length){
				db.query('UPDATE `errors` SET `count`='+db.ec(data[0].count+1)+' WHERE id='+db.ec(data[0].id));
			}
			else{
				err.message = err.message || '';
				err.file = err.file || '';
				err.line = err.line || -1;
				err.stack = err.stack || '';
				db.query('INSERT INTO `errors`(`message`,`app`,`file`,`line`,`stack`) VALUES('+db.ec(err.message)+','+db.ec('admin')+','+db.ec(err.file)+','+db.ec(err.line)+','+db.ec(err.stack)+')');
			}
		});
	});

	//cursors
	socket.cursorVisibility = false;
	socket.cursor = {
		mouseX: 0,
		mouseY: 0,
		viewX: 0,
		viewY: 0,
		map: -1,
		selectY: 0,
		selectX: 0,
		selectW: 0,
		selectH: 0,
		selected: 0,
	};
	socket.on('updateCursor',function(data){
		data = data || {};
		fn.combindOver(this.cursor,data);
	});
	socket.on('updateCursorVisibility',function(data){
		this.cursorVisibility = data;
	});
	//update loop
	socket.updateCursorsLoop = function(){
		if(this.cursorVisibility){
			var cursors = [];
			for (var i = 0; i < players.admins.length; i++) {
				if(players.admins[i].cursor.map === this.cursor.map && players.admins[i].cursorVisibility && players.admins[i] !== this){
					cursors.push(fn.combindOver({
						id: players.admins[i].userData.id,
						name: players.admins[i].userData.name
					},players.admins[i].cursor));
				}
			};

			this.emit('updateCursors',cursors);
		}

		setTimeout(this.updateCursorsLoop.bind(this),200);
	};
	socket.updateCursorsLoop();

	socket.updateUsers();
	maps.getMapList(function(maps){
		this.emit('mapsChange',maps);
	}.bind(socket));
	socket.emit('tilePropertiesChange',maps.tileProperties);

	socket.exit = function(){
		//remove myself from admin list
		for (var i = 0; i < players.admins.length; i++) {
			if(players.admins[i].userData.id == this.userData.id){
				players.admins.splice(i,1);
				break;
			}
		};
	};

	return socket;
};

//export
module.exports = Admin;