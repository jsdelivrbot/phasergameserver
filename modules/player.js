function Player(userData,socket){
	console.timeLog(userData.name+' loged on')

	//dont set socket.id becuase its already used
	socket.userData = userData; //dont use this as active data

	socket.userID = userData.id;
	socket.health = userData.health;
	socket.position = {
		x: userData.x || -1, //a position of -1 is inturprated as maps spawn
		y: userData.y || -1,
		map: userData.map || 0
	}
	socket.inventory = userData.inventory || []

	socket.on('disconnect',function(){
		console.timeLog(this.userData.name+' loged off')
		this.exit();
	})

	socket.on('updatePosition',function(data){
		this.move(data.x,data.y,data.map);
	}.bind(socket))

	socket.on('getLayers',function(cb){
		cb(maps.layers);
	}.bind(socket))
	
	socket.on('getChunk',function(data,cb){
		maps.getChunk(data.x,data.y,data.map,function(chunk){
			if(cb) cb(chunk.exportData());
		})
	})

	socket.update = function(){ //send all the players down
		var _players = [];
		for (var i = 0; i < players.players.length; i++) {
			var player = players.players[i];
			if(player.position.map === this.position.map && player !== this){
				_players.push({
					id: player.userID,
					name: player.userData.name,
					x: player.position.x,
					y: player.position.y,
					health: this.health
				});
			}
		};

		this.emit('updatePlayers',_players);
	}
	socket.exportData = function(){ //exports data in db format
		return fn.combindIn(fn.duplicate(this.userData),{
			x: this.position.x,
			y: this.position.y,
			map: this.position.map,
			inventory: this.inventory,
		})
	}
	socket.move = function(x,y,map){ //update the players location
		this.position.x = (x !== undefined)? x : this.position.x;
		this.position.y = (y !== undefined)? y : this.position.y;
		this.position.map = (map !== undefined)? map : this.position.map;
	}
	socket.save = function(cb){
		players.savePlayer(this.userID,cb);
	}
	socket.exit = function(){
		this.save(function(){
			players.removePlayer(this.userID);
		}.bind(this))
	}

	//send the maps first
	maps.getMapList(function(maps){
		this.emit('mapsChange',maps);

		//send userData
		this.emit('userData',this.userData)
	}.bind(socket))

	//bind error events
	socket.on('logError',function(err){
		db.query("SELECT id, count FROM errors WHERE app='game' AND message="+db.ec(err.message)+" AND file="+db.ec(err.file)+" AND line="+db.ec(err.line),function(data){
			if(data.length){
				db.query('UPDATE `errors` SET `count`='+db.ec(data[0].count+1)+' WHERE id='+db.ec(data[0].id));
			}
			else{
				db.query('INSERT INTO `errors`(`message`,`app`,`file`,`line`,`stack`) VALUES('+db.ec(err.message)+','+db.ec('game')+','+db.ec(err.file)+','+db.ec(err.line)+','+db.ec(err.stack)+')');
			}
		});
	});

	return socket;
}

//export
module.exports = Player;