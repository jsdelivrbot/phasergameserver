var EventEmitter = require('events');
var SortedArray = require('./sortedArray.js');

function array(val,length){
	var a = [];
	for (var i = 0; i < length; i++) {
		a.push(val);
	};
	return a;
}

maps = {
	defaultTile: 0,
	saveTime: 1000,
	unloadTime: 15, //in min
	layers: [],
	maps: [],
	tileProperties: {}, //array of tile info
	events: new EventEmitter(),
	/*
	mapsChange: nothing
	mapLoaded-"mapID": map
	mapLoaded-x-y-mapID: chunk
	tilesChange: array of tiles
	layersChange: layers
	*/

	//classes
	Map: function(id){
		this.desc = '';
		this.width = 0;
		this.height = 0;
		// this.layers = [];
		this.url = '';
		this.name = '';
		this.id = id;

		this.saved = true;
		this.chunks = [];
		this.lastGet = new Date();
		this.loaded = false; //weather it has been loaded from the db

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
				if(chunk.loaded){
					if(cb) cb(chunk);
				}
				else{
					//its loading
					maps.events.once('chunkLoaded-'+chunk.x+'-'+chunk.y+'-'+chunk.map.id,cb);
				}
			}
			else{
				this.loadChunk(x,y,cb);
			}
		};
		this.chunkLoaded = function(x,y){
			for (var i = 0; i < this.chunks.length; i++) {
				if(this.chunks[i].x === x && this.chunks[i].y === y){
					return true;
				}
			};
			return false;
		};
		this.loadChunk = function(x,y,cb){ //creates a new chunk and trys to load it from the db
			chunk = new maps.Chunk(x,y,this);

			if(x>=0&&y>=0&&x<this.width&&y<this.height){
				this.chunks.push(chunk);
				//load
				db.query('SELECT * FROM chunks WHERE x='+db.ec(x)+' AND y='+db.ec(y)+' AND map='+db.ec(this.id),function(chunk,data){
					chunk.loaded = true;
					if(data.length){
						chunk.importData(data[0]);
					}
					maps.events.emit('chunkLoaded-'+chunk.x+'-'+chunk.y+'-'+chunk.map.id,chunk);
					if(cb) cb(chunk);
				}.bind(this,chunk));
			}
			else{
				if(cb) cb(chunk);
			}
		};
		this.chunkExists = function(x,y,cb){ //checks to see if the chunk is in the db
			db.query('SELECT * FROM chunks WHERE x='+db.ec(x)+' AND y='+db.ec(y)+' AND map='+db.ec(this.id),function(data){
				if(cb) cb(data.length > 0);
			})
		};
		this.insertChunk = function(chunk,cb){ //inserts a chunk into the db
			data = chunk.exportData();
			db.query("INSERT INTO `chunks`(`map`, `x`, `y`, `data`) VALUES("+db.ec(data.map)+", "+db.ec(data.x)+", "+db.ec(data.y)+", "+db.ec(JSON.stringify(data.data))+")",function(){
				//dont load it becuase this is triggered by the save loop and it is already loaded
				if(cb) cb();
			}.bind(this))
		};
		this.saveChunk = function(x,y,cb){ //saves chunk to db (chunk has to exists in db)
			this.getChunk(x,y,function(chunk){
				data = chunk.exportData();
				chunk.saved = true;
				db.query("UPDATE `chunks` SET `data`="+db.ec(JSON.stringify(data.data))+" WHERE `x`="+db.ec(data.x)+" AND `y`="+data.y+" AND `map`="+data.map,function(){
					if(cb) cb();
				})
			}.bind(this))
		};
		this.removeChunk = function(x,y,cb){ //removes chunk from array
			for (var i = 0; i < this.chunks.length; i++) {
				if(this.chunks[i].x === x && this.chunks[i].y === y){
					this.chunks.splice(i,1);
					break;
				}
			};
			if(cb) cb();
		};
		this.unloadChunk = function(x,y,cb){ //saves and removes chunk from array
			this.saveChunk(x,y,function(){
				this.removeChunk(x,y,cb);
			}.bind(this))
		};
		this.deleteChunk = function(x,y,cb){ //deletes chunk from the db
			db.query("DELETE FROM chunks WHERE x="+db.ec(x)+" AND y="+db.ec(y)+" AND map="+eb.ec(this.id),function(){
				if(this.chunkLoaded(x,y)){
					this.removeChunk(x,y);
				}
				if(cb) cb();
			}.bind(this))
		};
		this.saveAllChunks = function(cb){
			cb = _.after(this.width * this.height,cb || function(){});

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
		};
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
		};
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
		};

		this.importData = function(data){ //loads data from db format
			this.id = data.id;
			this.name = data.name;
			this.desc = data.desc;
			this.height = data.height;
			this.width = data.width;
			this.url = data.url;

			this.blank = false;
		};
		this.exportData = function(){ //exports map into db format
			return {
				id: this.id,
				desc: this.desc,
				width: this.width,
				height: this.height,
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
		this.loaded = false;

		//acts as the layers array
		this.__defineGetter__('layers',function(){ //syncs layers with map
			a = [];
			for (var i = 0; i < maps.layers.length; i++) {
				s = false;
				for (var k = 0; k < this._layers.length; k++) {
					if(this._layers[k].id === maps.layers[i].id){
						a.push(this._layers[k]);
						s = true;
					}
				};
				if(!s){
					a.push(new maps.Layer(maps.layers[i].id,this));
				}
			};
			this._layers = a;
			return a;
		});
		this._layers = [];

		this.getLayer = function(i){ //returns layer by index
			if(this.layerExists(i)){
				return this.layers[i];
			}
			else{
				return new maps.Layer(-1,this);
			}
		};
		this.layerExists = function(i){ //tests to see if this layer is on the map
			return this.layers[i] !== undefined;
		};

		this.importData = function(data){ //loads data from db format
			//load the layers
			if(data.data == ''){
				data.data = [];
			}
			else{
				data.data = JSON.parse(data.data);
			}

			a = this.layers;
			for (var i = 0; i < data.data.length; i++) {
				if(a[i]){
					a[i].importData(data.data[i]);
				}
			};
			//load data
			this.x = data.x;
			this.y = data.y;
			maps.getMap(data.map,function(map){
				this.map = map;
			}.bind(this))
		};
		this.exportData = function(){ //exports chunk into db format
			var a = this.layers;
			var b = [];
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
		};
		this.setTile = function(x,y,t){
			this.chunk.saved = false;
			this.tiles[y*this.width+x].tile = t;
		};

		this.importData = function(data){ //imports a tiles array
			//loop through it and set the tiles
			for (var i = 0; i < data.length; i++) {
				this.tiles[i].tile = data[i];
			};
		};
		this.exportData = function(){
			var tiles = [];
			for (var i = 0; i < this.tiles.length; i++) {
				tiles.push(this.tiles[i].tile);
			};
			return tiles;
		};

		for (var i = 0; i < this.tiles.length; i++) {
			this.tiles[i] = new maps.Tile(
				i-(Math.floor(i/this.width)*this.width),
				Math.floor(i/this.width),
				maps.defaultTile,
				this
			);
		};
	},
	Tile: function(x,y,tile,layer){
		this.tile = tile || maps.defaultTile;
		this.x = x || 0;
		this.y = y || 0;
		this.layer = layer;
		this.__defineGetter__('mapX',function(){
			return (this.layer.chunk.x*16)+this.x;
		});
		this.__defineGetter__('mapY',function(){
			return (this.layer.chunk.y*16)+this.y;
		})
	},
	//functions
	init: function(cb){
		this.saveMapLoop(0);
		this.unloadMapLoop(0);
		this.saveChunkLoop(0);
		this.unloadChunkLoop(0);
		this.updateLayers(0);

		this.loadTileProperties(cb);

		//set the max listeners
		//mainly for the chunk/map load events
		this.events.setMaxListeners(100);

		this.events.on('mapsChange',function(data){
			io.emit('mapsChange',data);
		});
		this.events.on('tilesChange',function(data){
			io.emit('tilesChange',data);
		});
		this.events.on('layersChange',function(data){
			io.emit('updateLayers',data);
		});
		this.events.on('tilePropertiesChange',function(data){
			io.emit('tilePropertiesChange',data);
		})
	},
	getMapList: function(cb){ //returns a list of maps not sorted by id
		db.query('SELECT * FROM maps',function(data){
			for (var i = 0; i < data.length; i++) {
				if(this.mapLoaded(data[i].id)){
					for (var k = 0; k < maps.maps.length; k++) {
						if(maps.maps[k].id === data[i].id){
							fn.combindIn(data[i],maps.maps[k].exportData());
							break;
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
				if(map.loaded){
					if(cb) cb(this.maps[i]);
				}
				else{
					//its loading
					this.events.once('mapLoaded-'+mapID,cb);
				}
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
	getTiles: function(from,to,m,cb){ //get tiles in a rect from a map
		from = fn.combindIn({
			x: 0,
			y: 0,
			l: 0
		},from || {});
		to = fn.combindIn(fn.duplicate(from),to || {});
		to.x = (to.x < from.x)? from.x : to.x;
		to.y = (to.y < from.y)? from.y : to.y;
		to.l = (to.l < from.l)? from.l : to.l;
		cb = _.after(((to.l-from.l)+1)*((to.x-from.x)+1)*((to.y-from.y)+1),cb || function(){});

		var data = {
			x: from.x,
			y: from.y,
			width: (to.x - from.x)+1,
			height: (to.y - from.y)+1,
			data: []
		};

		for (var l = from.l; l <= to.l; l++) {
			for (var x = from.x; x <= to.x; x++) {
				for (var y = from.y; y <= to.y; y++) {
					this.getTile(x,y,l,m,function(x,y,l,m,tile){
						if(!data.data[l]){
							data.data[l] = [];
						}

						data.data[l].push(tile);

						cb(data);
					}.bind(this,x,y,l,m))
				};
			};
		};
	},
	setTiles: function(data,cb,dontFire){ //set tiles in a rect
		data = fn.combindOver({
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			data: [],
			primaryLayer: 0,
			map: -1,
			activeLayer: 0
		},data);

		this.getMap(data.map,function(map){
			for (var l = 0; l < data.data.length; l++) {
				var layer = data.activeLayer + (l - data.primaryLayer);
				for (var t = 0; t < data.data[l].length; t++) {
					var x = data.x + (t-Math.floor(t/data.width)*data.width);
					var y = data.y + Math.floor(t/data.width);

					//see if its a -1 tile
					if(data.data[l][t] == -1){
						continue;
					}
					//set the tile to default tile if its out of the map
					if(x < 0 || y < 0 || x >= map.width*16 || y >= map.height*16){
						data.data[l][t] = this.defaultTile;
					}

					map.getChunk(Math.floor(x/16),Math.floor(y/16),function(x,y,layer,tile,chunk){
						layer = chunk.getLayer(layer);
						x = x-Math.floor(x/16)*16;
						y = y-Math.floor(y/16)*16;

						layer.setTile(x,y,tile);
					}.bind(this,x,y,layer,data.data[l][t]))
				};
			};
		}.bind(this));
		if(!dontFire){
			this.events.emit('tilesChange',data);
		}
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
		this.maps.push(map);
		//load it
		db.query('SELECT * FROM maps WHERE id='+db.ec(mapID),function(map,data){
			map.loaded = true;
			if(data.length){
				map.importData(data[0]);
			}
			this.events.emit('mapLoaded-'+map.id,map);
			if(cb) cb(map);
		}.bind(this,map));
		return map;
	},
	loadTileProperties: function(cb){
		db.query('SELECT * FROM tiles',function(tiles){
			for (var i = 0; i < tiles.length; i++) {
				tiles[i].collisionInfo = JSON.parse(tiles[i].collisionInfo);

				this.tileProperties[tiles[i].id] = tiles[i];
			};
			if(cb) cb();
		}.bind(this));
	},
	saveMap: function(mapID,cb){ //saves a map from the array to the db (it has to already exist in the db)
		this.getMap(mapID,function(map){
			data = map.exportData();
			map.saved = true;
			db.query('UPDATE `maps` SET `name`='+db.ec(data.name)+', `desc`='+db.ec(data.desc)+', `width`='+db.ec(data.width)+', `height`='+db.ec(data.height)+' WHERE id='+db.ec(data.id),function(data){
				if(cb) cb();
			})
		}.bind(this))
	},
	saveTileProperties: function(tileID,cb){
		var tile = this.tileProperties[tileID];

		if(tile){
			db.query('SELECT * FROM tiles WHERE id='+db.ec(tile.id),function(data){
				if(data.length){
					db.query('UPDATE `tiles` SET `blank`='+db.ec(tile.blank)+', `collision`='+db.ec(tile.collision)+', `collisionInfo`='+db.ec(tile.collisionInfo)+' WHERE id='+db.ec(tile.id), function(){
						if(cb) cb();
					});
				}
				else{
					db.query('INSERT INTO tiles(id,blank,collision,collisionInfo) VALUES('+db.ec(tile.id)+', '+db.ec(tile.blank)+', '+db.ec(tile.collision)+', '+db.ec(tile.collisionInfo)+')',function(){
						if(cb) cb();
					})
				}
			});

			return;
		}

		if(cb) cb();
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
	saveAllMaps: function(cb){
		db.reconnect(function(){
			cb = _.after(this.maps.length+1,cb);
			for (var i = 0; i < this.maps.length; i++) {
				if(!this.maps[i].saved){
					this.saveMap(this.maps[i].id,cb);
				}
				else{
					cb();
				}
			};
			cb();
		}.bind(this))
	},
	saveAllChunks: function(cb){
		db.reconnect(function(){
			cb = _.after(this.maps.length+1,cb);
			for (var i = 0; i < this.maps.length; i++) {
				this.maps[i].saveAllChunks(cb);
			};
			cb();
		}.bind(this))
	},
	saveAllTileProperties: function(cb){
		db.reconnect(function(){
			var k=1;
			for(var tile in this.tileProperties){
				k++;
			}
			cb = _.after(k,cb || function(){});
			for(var tile in this.tileProperties){
				this.saveTileProperties(this.tileProperties[tile].id,cb);
			}
			cb();
		}.bind(this))
	},
	tilePropertiesChange: function(data){
		if(_.isArray(data)){
			var tiles = [];
			for (var i = 0; i < data.length; i++) {
				tile = fn.combindOver({
					id: -1,
					blank: false,
					collision: false,
					collisionInfo: {
						right: 0,
						left: 0,
						top: 0,
						bottom: 0
					}
				},data[i]);
				this.tileProperties[tile.id] = tile;
				tiles.push(tile);
			}
			this.events.emit('tilePropertiesChange',tiles);
		}
		else{
			tile = fn.combindOver({
				id: -1,
				blank: false,
				collision: false,
				collisionInfo: {
					right: 0,
					left: 0,
					top: 0,
					bottom: 0
				}
			},data);
			this.tileProperties[tile.id] = tile;
			this.events.emit('tilePropertiesChange',tile);
		}
	},
	//db
	insertMap: function(map,cb){ //inserts a new map into the db based off an existing one
		data = map.exportData();
		db.query('INSERT INTO `maps`(`name`, `width`, `height`, `desc`) VALUES('+db.ec(data.name)+','+db.ec(data.width)+','+db.ec(data.height)+','+db.ec(data.desc)+')',function(data){
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
	//layers
	getLayer: function(id){
		for (var i = 0; i < this.layers.length; i++) {
			if(this.layers[i].id === id){
				return this.layers[i];
			}
		};
	},
	createLayer: function(data,cb){
		db.query('INSERT INTO `layers`(`title`,`description`,`level`,`abovePlayer`,`visibleInGame`,`collision`) VALUES('+db.ec(data.title)+','+db.ec(data.description)+','+db.ec(data.level)+','+db.ec(data.abovePlayer)+','+db.ec(data.visibleInGame)+','+db.ec(data.collision)+')',function(){
			this.updateLayers(cb);
		}.bind(this))
	},
	changeLayer: function(data,cb){
		db.query('UPDATE `layers` SET `title`='+db.ec(data.title)+', `description`='+db.ec(data.description)+', `level`='+db.ec(data.level)+', `abovePlayer`='+db.ec(data.abovePlayer)+', `visibleInGame`='+db.ec(data.visibleInGame)+', `collision`='+db.ec(data.collision)+' WHERE id='+db.ec(data.id),function(){
			this.updateLayers(cb);
		}.bind(this))
	},
	deleteLayer: function(id,cb){
		db.query('DELETE FROM `layers` WHERE id='+db.ec(id),function(){
			this.updateLayers(cb);
		}.bind(this))
	},
	updateLayers: function(cb){
		db.query('SELECT * FROM layers',function(data){
			this.layers = data;
			this.events.emit('layersChange',this.layers);
			if(cb) cb(this.layers);
		}.bind(this))
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
				}.bind(this));
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
				}.bind(this,map,chunk);

				if(!chunk.saved){
					chunk.saved = true;
					map.chunkExists(chunk.x,chunk.y,function(map,chunk,exists){
						if(exists){
							map.saveChunk(chunk.x,chunk.y,cb);

						}
						else{
							map.insertChunk(chunk,cb);

						}
					}.bind(this,map,chunk));
					return;
				}
				else{
					cb();
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
};

module.exports = maps;