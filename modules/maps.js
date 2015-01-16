var events = require('events');

function array(val,length){
	var a = [];
	for (var i = 0; i < length; i++) {
		a.push(val);
	};
	return a;
}

maps = {
	defaultTile: 1,
	saveTime: 1000,
	unloadTime: 15, //in min
	// mapList: [], //for map ref (not sorted my id)
	maps: [],
	events: new events.EventEmitter(),
	/*
	mapsChange: nothing
	*/

	//classes
	Map: function(id){
		this.desc = '';
		this.width = 0;
		this.height = 0;
		this.layers = [];
		this.island = -1;
		this.url = '';
		this.name = '';
		this.id = id;

		this.saved = true;
		this.chunks = [];
		this.lastGet = new Date();

		this.getChunk = function(x,y,cb){ //gets chunk from array, cb is for when it loads
			chunk = null;
			for (var i = 0; i < this.chunks.length; i++) {
				if(this.chunks[i].x === x && this.chunks[i].y === y){
					chunk = this.chunks[i];
					chunk.lastGet = new Date();
					break;
				}
			};
			if(chunk){
				if(cb) cb(chunk);
			}
			else{
				this.loadChunk(x,y,cb);
			}
		}
		this.chunkLoaded = function(x,y){
			for (var i = 0; i < this.chunks.length; i++) {
				if(this.chunks[i].x === x && this.chunks[i].y === y){
					return true;
				}
			};
			return false;
		}
		this.loadChunk = function(x,y,cb){ //creates a new chunk and trys to load it from the db
			chunk = new maps.Chunk(x,y,this);

			if(x>=0&&y>=0&&x<this.width&&y<this.height){
				this.chunks.push(chunk);
				//load
				db.query('SELECT * FROM chunks WHERE x='+db.ec(x)+' AND y='+db.ec(y)+' AND map='+db.ec(this.id),function(chunk,data){
					if(data.length){
						chunk.inportData(data[0]);
					}
					if(cb) cb(chunk);
				}.bind(this,chunk));
			}
			else{
				if(cb) cb(chunk);
			}
		}
		this.chunkExists = function(x,y,cb){ //checks to see if the chunk is in the db
			db.query('SELECT * FROM chunks WHERE x='+db.ec(x)+' AND y='+db.ec(y)+' AND map='+db.ec(this.id),function(data){
				if(cb) cb(data.length > 0);
			})
		}
		this.insertChunk = function(chunk,cb){ //inserts a chunk into the db
			data = chunk.exportData();
			db.query("INSERT INTO `chunks`(`map`, `x`, `y`, `data`) VALUES("+db.ec(data.map)+", "+db.ec(data.x)+", "+db.ec(data.y)+", "+db.ec(JSON.stringify(data.data))+")",function(){
				//dont load it becuase this is triggered by the save loop and it is already loaded
				if(cb) cb();
			}.bind(this))
		}
		this.saveChunk = function(x,y,cb){ //saves chunk to db (chunk has to exists in db)
			this.getChunk(x,y,function(chunk){
				data = chunk.exportData()
				chunk.saved = true;
				db.query("UPDATE `chunks` SET `data`="+db.ec(JSON.stringify(data.data))+" WHERE `x`="+db.ec(data.x)+" AND `y`="+data.y+" AND `map`="+data.map,function(){
					if(cb) cb();
				})
			}.bind(this))
		}
		this.removeChunk = function(x,y,cb){ //removes chunk from array
			for (var i = 0; i < this.chunks.length; i++) {
				if(this.chunks[i].x === x && this.chunks[i].y === y){
					this.chunks.splice(i,1);
					break;
				}
			};
			if(cb) cb();
		}
		this.unloadChunk = function(x,y,cb){ //saves and removes chunk from array
			this.saveChunk(x,y,function(){
				this.removeChunk(x,y,cb);
			}.bind(this))
		}
		this.deleteChunk = function(x,y,cb){ //deletes chunk from the db
			db.query("DELETE FROM chunks WHERE x="+db.ec(x)+" AND y="+db.ec(y)+" AND map="+eb.ec(this.id),function(){
				if(this.chunkLoaded(x,y)){
					this.removeChunk(x,y);
				}
				if(cb) cb();
			}.bind(this))
		}
		this.saveAllChunks = function(cb){
			if(cb){
				_.after(this.width * this.height,cb)
			}
			else{
				_.after(this.width * this.height,function(){})
			}

			for (var x = 0; x < this.width; x++) {
				for (var y = 0; y < this.height; y++) {
					if(this.chunkLoaded(x,y)){
						this.getChunk(x,y,function(chunk){
							if(!chunk.saved){
								this.saveChunk(chunk.x,chunk.y,cb)
							}
							else{
								cb();
							}
						}.bind(this))
					}
					else{
						cb();
					}
				};
			};
		}
		this.unloadAllChunks = function(cb){
			if(cb){
				_.after(this.width * this.height,cb)
			}
			else{
				_.after(this.width * this.height,function(){})
			}

			for (var x = 0; x < this.width; x++) {
				for (var y = 0; y < this.height; y++) {
					if(this.chunkLoaded(x,y)){
						this.getChunk(x,y,function(chunk){
							if(!chunk.saved){
								this.unloadChunk(chunk.x,chunk.y,cb)
							}
							else{
								this.removeChunk(chunk.x,chunk.y,cb)
							}
						}.bind(this))
					}
					else{
						cb();
					}
				};
			};
		}
		this.deleteAllChunks = function(cb){
			if(cb){
				_.after(this.width * this.height,cb)
			}
			else{
				_.after(this.width * this.height,function(){})
			}

			for (var x = 0; x < this.width; x++) {
				for (var y = 0; y < this.height; y++) {
					if(this.chunkLoaded(x,y)){
						this.deleteChunk(x,y,cb);
					}
					else{
						cb();
					}
				};
			};
		}

		this.inportData = function(data){ //loads data from db format
			if(data.layers == ''){
				data.layers = [];
			}
			else{
				data.layers = JSON.parse(data.layers);
			}
			this.id = data.id;
			this.name = data.name;
			this.desc = data.desc;
			this.height = data.height;
			this.width = data.width;
			this.layers = data.layers;
			this.island = data.island;
			this.url = data.url;

			this.blank = false;
		}
		this.exportData = function(){ //exports map into db format
			return {
				id: this.id,
				desc: this.desc,
				width: this.width,
				height: this.height,
				layers: this.layers,
				island: this.island,
				url: this.url,
				name: this.name
			}
		}
	},
	Chunk: function(x,y,map){
		this.x = x || 0;
		this.y = y || 0;
		this.tiles = {};
		this.map = map;

		this.saved = true;
		this.lastGet = new Date();

		//acts as the layers array
		this.__defineGetter__('layers',function(){ //syncs layers with map
			a = [];
			for (var i = 0; i < this.map.layers.length; i++) {
				s = false;
				for (var k = 0; k < this._layers.length; k++) {
					if(this._layers[k].id === this.map.layers[i].id){
						a.push(this._layers[k]);
						s = true;
					}
				};
				if(!s){
					a.push(new maps.Layer(this.map.layers[i].id,this));
				}
			};
			this._layers = a;
			return a;
		})
		this._layers = [];

		this.getLayer = function(i){ //returns layer
			if(this.layerExists(i)){
				return this.layers[i];
			}
			else{
				return new maps.Layer(i,this);
			}
		}
		this.layerExists = function(i){ //tests to see if this layer is on the map
			return this.layers[i] !== undefined;
		}

		this.inportData = function(data){ //loads data from db format
			//load the layers
			if(data.data == ''){
				data.data = [];
			}
			else{
				data.data = JSON.parse(data.data);
			}

			a = this.layers;
			for (var i = 0; i < data.data.length; i++) {
				a[i].inportData(data.data[i]);
			};
			//load data
			this.x = data.x;
			this.y = data.y;
			maps.getMap(data.map,function(map){
				this.map = map;
			}.bind(this))
		}
		this.exportData = function(){ //exports chunk into db format
			a = this.layers;
			b = []
			for (var i = 0; i < a.length; i++) {
				b.push(a[i].exportData());
			};
			return {
				x: this.x,
				y: this.y,
				map: this.map.id,
				data: b
			}
		}
	},
	Layer: function(id,chunk){
		this.id = id;
		this.chunk = chunk;
		this.width = 16;
		this.height = 16;
		this.tiles = array(maps.defaultTile,this.width*this.height);

		this.getTile = function(x,y){
			return this.tiles[y*this.width+x];
		}
		this.setTile = function(x,y,t){
			this.chunk.saved = false;
			return this.tiles[y*this.width+x] = t;
		}

		this.inportData = function(data){
			fn.combindIn(this.tiles,data);
		}
		this.exportData = function(){
			return this.tiles;
		}
	},
	//functions
	init: function(cb){
		this.saveMapLoop(0);
		this.unloadMapLoop(0);
		this.saveChunkLoop(0);
		this.unloadChunkLoop(0);
	},
	getMapList: function(cb){ //returns a list of maps not sorted by id
		db.query('SELECT * FROM maps',function(data){
			for (var i = 0; i < data.length; i++) {
				if(data[i].layers === ''){
					data[i].layers = '[]';
				}
				data[i].layers = JSON.parse(data[i].layers);

				//update from maps
				if(this.mapLoaded(data[i].id)){
					for (var k = 0; k < maps.maps.length; k++) {
						if(maps.maps[k].id === data[i].id){
							fn.combindIn(data[i],maps.maps[k].exportData());
							//just in case the combind messed up the layers
							data[i].layers = maps.maps[k].layers;
						}
					};
				}
			};
			if(cb) cb(data);
		}.bind(this))
	},

	getMap: function(mapID,cb){ //gets a map from the array, creates one if it dose not exists and it exists in the db. needs cb
		for (var i = 0; i < this.maps.length; i++) {
			if(this.maps[i].id === mapID){
				map.lastGet = new Date();
				if(cb) cb(this.maps[i]);
				return;
			}
		};
		this.loadMap(mapID,cb); //its not in the array, make a new one and try to load it
	},
	getChunk: function(x,y,m,cb){
		this.getMap(m,function(map){
			map.getChunk(x,y,cb);
		}.bind(this))
	},
	getLayer: function(x,y,l,m,cb){
		this.getMap(m,function(map){
			map.getChunk(x,y,function(chunk){
				if(cb) cb(chunk.getLayer(l));
			}.bind(this))
		}.bind(this))
	},
	getTile: function(x,y,l,m,cb){
		this.getMap(m,function(map){
			map.getChunk(Math.floor(x/16),Math.floor(y/16),function(chunk){
				if(cb) cb(chunk.getLayer(l).getTile(x-Math.floor(x/16)*16,y-Math.floor(y/16)*16));
			}.bind(this))
		}.bind(this))
	},
	setTile: function(x,y,l,m,t,cb){
		this.getMap(m,function(map){
			map.getChunk(Math.floor(x/16),Math.floor(y/16),function(chunk){
				if(cb) cb(chunk.getLayer(l).setTile(x-Math.floor(x/16)*16,y-Math.floor(y/16)*16,t));
			}.bind(this))
		}.bind(this))
	},
	mapLoaded: function(mapID){
		//cant use getMap becuase it always returns
		for (var i = 0; i < this.maps.length; i++) {
			if(this.maps[i].id === mapID){
				return true;
			}
		};
		return false;
	},
	loadMap: function(mapID,cb){ //returns a new map and trys to load it from db, if it wes in the db it puts it into the array
		map = new maps.Map(mapID);
		//load it
		db.query('SELECT * FROM maps WHERE id='+db.ec(mapID),function(map,data){
			if(data.length){
				map.inportData(data[0]);
				this.maps.push(map);
			}
			if(cb) cb(map);
		}.bind(this,map));
		return map;
	},
	saveMap: function(mapID,cb){ //saves a map from the array to the db (it has to already exist in the db)
		this.getMap(mapID,function(map){
			data = map.exportData();
			map.saved = true;
			db.query('UPDATE `maps` SET `name`='+db.ec(data.name)+', `desc`='+db.ec(data.desc)+', `width`='+db.ec(data.width)+', `height`='+db.ec(data.height)+', `island`='+db.ec(data.island)+', `layers`='+db.ec(JSON.stringify(data.layers))+' WHERE id='+db.ec(data.id),function(data){
				if(cb) cb();
			})
		}.bind(this))
	},
	unloadMap: function(mapID,cb){ //saves and removes map from array
		this.saveMap(mapID,function(){
			this.removeMap(mapID,cb)
		}.bind(this))
	},
	removeMap: function(mapID,cb){ //removes map from array
		//cant use getMap becuase it returns the map and not the index
		for (var i = 0; i < this.maps.length; i++) {
			if(this.maps[i].id === mapID){
				this.maps.splice(i,1);
				if(cb) cb(true);
				return;
			}
		};
		if(cb) cb(false);
	},
	//db
	insertMap: function(map,cb){ //inserts a new map into the db based off an existing one
		data = map.exportData();
		db.query('INSERT INTO `maps`(`name`, `island`, `width`, `height`, `desc`) VALUES('+db.ec(data.name)+','+db.ec(data.island)+','+db.ec(data.width)+','+db.ec(data.height)+','+db.ec(data.desc)+')',function(data){
			//load it
			this.getMap(data.insertId,cb);
		}.bind(this))
	},
	deleteMap: function(mapID,cb){ //deletes map from db
		//delete the map from the db
		db.query('DELETE FROM `maps` WHERE id='+db.ec(mapID),function(data){
			//if its in the array then remove it form there
			if(this.mapLoaded(mapID)){
				this.removeMap(mapID);
			}
			if(cb) cb();
		}.bind(this));
	},

	saveMapLoop: function(i){ //repeating loop that saves maps
		if(this.maps[i]){
			m = this.maps[i];
			if(m.saved == false){
				this.saveMap(m.id,function(){
					m.saved = true;

					if(++i >= this.maps.length){
						i=0
					}
					setTimeout(this.saveMapLoop.bind(this,i),this.saveTime);
				}.bind(this))
				return;
			}
		}
		if(++i >= this.maps.length){
			i=0
		}
		setTimeout(this.saveMapLoop.bind(this,i),this.saveTime);
	},
	saveChunkLoop: function(mapIndex,chunkIndex){
		//find the x,y of the chunk based off the index
		if(this.maps[mapIndex]){
			if(this.maps[mapIndex].chunks[chunkIndex]){
				var map = this.maps[mapIndex];
				var chunk = map.chunks[chunkIndex];
				cb = function(map,chunk){
					if(++chunkIndex < map.chunks.length){
						//next chunk
					}
					else{
						//next map
						if(++mapIndex < maps.maps.length){
							chunkIndex = 0;
						}
						else{
							//end of maps
							mapIndex = 0;
							chunkIndex = 0;
						}
					}
					setTimeout(this.saveChunkLoop.bind(this,mapIndex,chunkIndex),this.saveTime);
				}.bind(this,map,chunk)

				if(!chunk.saved){
					map.chunkExists(chunk.x,chunk.y,function(map,chunk,exists){
						if(exists){
							map.saveChunk(chunk.x,chunk.y,cb);
							return;
						}
						else{
							map.insertChunk(chunk,cb);
							return;
						}
					}.bind(this,map,chunk))
					return;
				}
			}
		}
		setTimeout(this.saveChunkLoop.bind(this,0,0),this.saveTime);
	},
	unloadMapLoop: function(i){ //repeating loop that unloads maps when thet have not been gotten in 30min
		if(this.maps[i]){
			var m = this.maps[i];
			var d = new Date();
			d.setMinutes(d.getMinutes()-maps.unloadTime);
			if(m.saved && m.lastGet < d){
				//see if all the chunks have been saved
				for (var i = 0; i < m.chunks.length; i++) {
					if(m.chunks[i].saved && m.chunks[i].lastGet < d){
						this.removeMap(m.id);
					}
				};
			}
		}
		if(++i >= this.maps.length){
			i=0
		}
		setTimeout(this.unloadMapLoop.bind(this,i),this.saveTime);
	},
	unloadChunkLoop: function(mapIndex,chunkIndex){
		//find the x,y of the chunk based off the index
		if(this.maps[mapIndex]){
			if(this.maps[mapIndex].chunks[chunkIndex]){
				var map = this.maps[mapIndex];
				var chunk = map.chunks[chunkIndex];

				var d = new Date();
				d.setMinutes(d.getMinutes()-maps.unloadTime);
				if(chunk.saved && chunk.lastGet < d){
					map.removeChunk(chunk.x,chunk.y);
				}

				if(++chunkIndex < map.chunks.length){
					//next chunk
				}
				else{
					//next map
					if(++mapIndex < maps.maps.length){
						chunkIndex = 0;
					}
					else{
						//end of maps
						mapIndex = 0;
						chunkIndex = 0;
					}
				}
				setTimeout(this.unloadChunkLoop.bind(this,mapIndex,chunkIndex),this.saveTime);
				return;
			}
		}
		setTimeout(this.unloadChunkLoop.bind(this,0,0),this.saveTime);
	}
}

module.exports = maps;