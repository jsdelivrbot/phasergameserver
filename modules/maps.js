var events = require('events');

maps = {
	defaultTile: 1,
	saveTime: 1000,
	// mapList: [], //for map ref (not sorted my id)
	maps: [],
	chunks: [],
	events: new events.EventEmitter(),
	/*
	chunkTileChange: x,y,tile,admin/socket
	mapsChange: mapList
	mapSave: mapID
	chunkSave: x,y,map
	mapLoadFromDB: mapObj
	chunkLoadFromDB: chunkObj
	*/

	//classes
	Map: function(){
		this.desc = '';
		this.width = 0;
		this.height = 0;
		this.layers = [];
		this.island = -1;
		this.url = '';
		this.name = '';
		this.id = -1;

		this.blank = true;
		this.saved = true;
		this.lastGet = Date();

		this.setTile = function(x,y,tile,cb,admin){ //finds the chunk and sets the tile, with an optional admin that set it
			maps.getChunk(Math.floor(x/16),Math.floor(y/16),function(c){
				c.setTile(x - (Math.floor(x/16)*16),y - (Math.floor(y/16)*16),tile,admin);
				if(cb) cb();
			})
		}
		this.getTile = function(x,y,tile,cb){ //finds the chunk and gets the tile
			maps.getChunk(Math.floor(x/16),Math.floor(y/16),function(c){
				t = c.getTile(x - (Math.floor(x/16)*16),y - (Math.floor(y/16)*16));
				if(cb) cb(t);
			})
		}
		this.loadFromDBData = function(data){ //loads from DB data
			if(data.layers === ''){
				data.layers = '[]';
			}
			this.height = data.height;
			this.width = data.width;
			this.desc = data.desc;
			this.island = data.island;
			this.layers = JSON.parse(data.layers);
			this.url = data.url;
			this.name = data.name;
			this.id = data.id;

			this.blank = false;

			maps.events.emit('mapLoadFromDB',this);
		}
		this.toData = function(){ //removes functions
			return JSON.parse(JSON.stringify(this)); //remove all the functions from me
		}
	},
	Chunk: function(x,y,map){
		this.x = x || 0;
		this.y = y || 0;
		this.map = map || 0;
		this.tiles = {};

		this.blank = true;
		this.saved = true;
		this.lastGet = Date();

		this.getTile = function(x,y){
			id = 'x:'+x+'-y:'+y;
			if(!this.tiles[id]){
				this.tiles[id] = 0;
			}
			return this.tiles[id];
		}
		this.setTile = function(x,y,tile,admin,dontSave){ //sets a tile the chunk, with an optional admin that set it
			id = 'x:'+x+'-y:'+y;
			this.getTile(x,y); //create it if is not there
			this.tiles[id] = tile; //set it

			if(!dontSave){
				this.saved = false;
				maps.events.emit('chunkTileChange',x,y,tile,admin);
			}
		}
		this.updateTiles = function(data){ //loads tile from DB but dose not set them (dose not fire change event)
			for(var i in data){ //data is a preset tiles array
				//see if the tiles is already in my array
				if(!this.tiles[i]){
					this.tiles[i] = data[i];
				}
			}
		}
		this.loadFromDBData = function(data){
			if(data.data === ''){
				data.data = '[]'; //set to an array because we still have to parse it
			}
			this.x = data.x;
			this.y = data.y;
			this.map = data.map;
			this.updateTiles(this.parseData(JSON.parse(data.data)));
			this.blank = false;

			maps.events.emit('chunkLoadFromDB',this);
		}
		this.parseData = function(json){
			if(typeof json == 'string'){
				json = JSON.parse(json);
			}
			data = {};
			s = 16;
			for (var i = 0; i < json.length; i++) {
				x = i-(Math.floor(i/s)*s);
				y = Math.floor(i/s);
				data['x:'+x+'-y:'+y] = json[i];
			};
			return data;
		}
		this.toData = function(){
			a = [];
			for(var i in this.tiles){
				a.push(this.tiles[i]);
			}
			return a;
		}

		//fill the tiles
		for (var y = 0; y < 16; y++) {
			for (var x = 0; x < 16; x++) {
				this.setTile(x,y,maps.defaultTile,null,true);
			};
		};
	},
	//functions
	init: function(cb){
		this.saveMapLoop(0);
		this.saveChunkLoop(0);
	},
	// updateMapList: function(cb){ // fires the mapsChange event
	// 	//update the list and combind it with the current loaded maps just in case they did not save yet
	// 	db.query('SELECT * FROM maps',function(data){
	// 		//loop through the maps and see if it missing layers
	// 		for (var i = 0; i < data.length; i++) {
	// 			if(data[i].layers === ''){
	// 				data[i].layers = '[]';
	// 			}
	// 			data[i].layers = JSON.parse(data[i].layers);

	// 			//update from maps
	// 			if(this.mapLoaded(data[i].id)){
	// 				m = this.maps[data[i].id]
	// 				fn.combindIn(data[i],m.toData());
	// 				//just in case the combind messed up the layers
	// 				data[i].layers = m.layers;
	// 			}
	// 		};
	// 		this.mapList = data;

	// 		this.events.emit('mapsChange',this.mapList)
	// 		if(cb) cb();
	// 	}.bind(this))
	// },
	getMapList: function(cb){ //returns a list of maps not sorted by id
		db.query('SELECT * FROM maps',function(data){
			for (var i = 0; i < data.length; i++) {
				if(data[i].layers === ''){
					data[i].layers = '[]';
				}
				data[i].layers = JSON.parse(data[i].layers);

				//update from maps
				if(this.mapLoaded(data[i].id)){
					m = this.maps[data[i].id]
					fn.combindIn(data[i],m.toData());
					//just in case the combind messed up the layers
					data[i].layers = m.layers;
				}
			};
			if(cb) cb(data);
		}.bind(this))
	},
	loadMap: function(mapID,cb){ //loads map into thecache
		m = new this.Map();
		//load it
		db.query('SELECT * FROM maps WHERE id='+db.ec(mapID),function(m,data){
			if(data.length){
				m.loadFromDBData(data[0]);
				this.maps[m.id] = m;
			}
			if(cb) cb(m);
		}.bind(this,m));
	},
	loadChunk: function(x,y,map,cb){ //loads chunk into the cache
		this.getMap(map,function(m){
			c = new this.Chunk(x,y,map);
			//see if the chunk is inside the map bounds, if not return a blank
			if(x>=0&&y>=0&&x<m.width&&y<m.height){
				//load it
				db.query('SELECT * FROM chunks WHERE x='+db.ec(x)+' AND y='+db.ec(y)+' AND map='+db.ec(map),function(c,data){
					//put it in the cache
					maps.chunks['x:'+c.x+'-y:'+c.y+'-map:'+c.map] = c;
					//if there is data load it
					if(data.length){
						c.loadFromDBData(data[0]);
					}
					else{
						//create chunk in db
						this.createChunk(c);
					}
					if(cb) cb(c);
				}.bind(this,c));
			}
			else{
				if(cb) cb(c);
			}
		}.bind(this));
	},
	getMap: function(mapID,cb){ //gets map from the cache
		if(!this.mapLoaded(mapID)){
			this.loadMap(mapID,function(m){
				m.lastGet = Date();
				if(cb) cb(m);
			})
		}
		else{
			this.maps[mapID].lastGet = Date();
			if(cb) cb(this.maps[mapID]);
		}
	},
	getChunk: function(x,y,map,cb){ //gets chunk from the cache
		id = 'x:'+x+'-y:'+y+'-map:'+map;
		if(!this.chunkLoaded(x,y,map)){
			this.loadChunk(x,y,map,function(c){
				c.lastGet = Date();
				if(cb) cb(c);
			})
		}
		else{
			this.chunks[id].lastGet = Date();
			if(cb) cb(this.chunks[id]);
		}
	},
	mapLoaded: function(mapID){ //checks if map is in the cache
		return this.maps[mapID] !== undefined;
	},
	chunkLoaded: function(x,y,map){ //checks if chunk is in the cache
		id = 'x:'+x+'-y:'+y+'-map:'+map;
		return this.chunks[id] !== undefined;
	},
	createMap: function(data,cb){ //creates a new map from data passed to it, loads it and then returns in
		db.query('INSERT INTO `maps`(`name`, `island`, `width`, `height`, `desc`) VALUES('+db.ec(data.name)+','+db.ec(data.island)+','+db.ec(data.width)+','+db.ec(data.height)+','+db.ec(data.desc)+')',function(data){
			//load it
			this.getMap(data.insertId,cb);
		}.bind(this))
	},
	createChunk: function(chunk,cb){ //creates a chunk in the DB, for a chunk in the cache
		chunk.blank = false;
		chunk.saved = false;
		db.query('INSERT INTO `chunks`(`x`, `y`, `map`) VALUES('+db.ec(chunk.x)+','+db.ec(chunk.y)+','+db.ec(chunk.map)+')',function(data){
			// this.saveChunk(chunk.x,chunk.y,chunk.map,cb) dont save it yet leave that up to the saving loop
		}.bind(this))
	},
	deleteMap: function(mapID,cb){ //removes map from cache and DB
		//delete the map from the db
		db.query('DELETE FROM `maps` WHERE id='+db.ec(mapID),function(data){
			//if its in the cache then delete it form there
			if(!this.mapLoaded(mapID)) return;
			delete this.maps[mapID];
			this.removeAllChunks(mapID,cb);
		}.bind(this));
	},
	deleteChunk: function(x,y,map){ //removes chunk from cache and DB
		db.query('DELETE FROM `chunks` WHERE x='+db.ec(x)+' AND y='+db.ec(y)+' AND map='+db.ec(map),function(data){
			//if its in the cache then delete it form there
			if(!this.chunkLoaded(x,y,map)) return;
			id = 'x:'+x+'-y:'+y+'-map:'+map;
			delete this.chunks[id];
		})
	},
	deleteAllChunks: function(map,cb){ //removes chunk for a map from cache and DB
		this.getMap(mapID,function(m){
			for (var k = 0; k < m.height; k++) {
				for (var i = 0; i < m.width; i++) {
					this.deleteChunk(i,k,mapID);
				};
			};

			if(cb) cb();
		})
	},
	updateMap: function(mapID,data,cb){ //updates a map with data
		this.getMap(mapID,function(map){
			fn.combindIn(map,data);
			map.saved = false;
			this.events.emit('mapsChange')
		}.bind(this))
	},
	removeMap: function(mapID){ //removes a map from cache
		delete this.maps[mapID];
	},
	removeChunk: function(x,y,map){ //removes a chunk from cache
		delete this.chunks['x:'+x+'-y:'+y+'-map:'+map];
	},
	numberOFMaps: function(){
		n=0;
		for(var i in this.maps){
			n++;
		}
		return n;
	},
	numberOFChunks: function(){
		n=0;
		for(var i in this.chunks){
			n++;
		}
		return n;
	},
	saveMap: function(mapID,cb,dontFire){ //saves a map to the db
		this.getMap(mapID,function(m){
			db.query('UPDATE `maps` SET `name`='+db.ec(m.name)+', `desc`='+db.ec(m.desc)+', `width`='+db.ec(m.width)+', `height`='+db.ec(m.height)+', `island`='+db.ec(m.island)+', `layers`='+db.ec(JSON.stringify(m.layers))+' WHERE id='+db.ec(m.id),function(data){
				if(!dontFire) this.events.emit('mapSave',mapID);
				if(cb) cb();
			}.bind(this))
		}.bind(this))
	},
	saveAllMaps: function(cb){ //saves all the maps to the db
		for(var i in this.maps){
			this.saveMap(parseInt(i),null,true);
		}
		if(cb) cb();
	},
	saveChunk: function(x,y,map,cb,dontFire){ //saves a chunk to the db
		this.getChunk(x,y,map,function(c){
			db.query('UPDATE `chunks` SET `data`='+db.ec(JSON.stringify(c.toData()))+' WHERE x='+db.ec(c.x)+' AND y='+db.ec(c.y)+' AND map='+db.ec(c.map),function(data){
				if(!dontFire) this.events.emit('chunkSave',x,y,map);
				if(cb) cb();
			}.bind(this))
		}.bind(this))
	},
	saveAllChunks: function(cb){ //saves all the chunks to the db
		for(var i in this.maps){
			this.saveChunk(parseInt(i),true);
		}
		if(cb) cb();
	},
	setTile: function(x,y,map,tile,cb,admin){ //sets a tile on a map, with an optional admin that set it
		this.getMap(map,function(m){
			m.setTile(x,y,tile,cb,admin);
		}.bind(this))
	},
	saveMapLoop: function(i){ //repeating loop that saves maps
		j = 0;
		for(var k in this.maps){
			if(j++ == i){
				//found the index
				m = this.maps[k];
				if(m.saved == false){
					this.saveMap(m.id,function(){
						m.saved = true;
						if(++i >= this.numberOFMaps()){
							i=0
						}
						setTimeout(this.saveMapLoop.bind(this,i),this.saveTime);
					}.bind(this))
					return;
				}
			}
		}
		if(++i >= this.numberOFMaps()){
			i=0
		}
		setTimeout(this.saveMapLoop.bind(this,i),this.saveTime);
	},
	saveChunkLoop: function(i){ //repeating loop that saves maps
		j = 0;
		for(var k in this.chunks){
			if(j++ == i){
				//found the index
				c = this.chunks[k];
				if(c.saved == false){
					this.saveChunk(c.x,c.y,c.map,function(){
						c.saved = true;
						console.log('saved map'.info+': '+i)
						if(++i >= this.numberOFChunks()){
							i=0
						}
						setTimeout(this.saveChunkLoop.bind(this,i),this.saveTime);
					}.bind(this))
					return;
				}
			}
		}
		if(++i >= this.numberOFMaps()){
			i=0
		}
		setTimeout(this.saveChunkLoop.bind(this,i),this.saveTime);
	}
}

module.exports = maps;