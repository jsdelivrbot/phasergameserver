resources = {
	resources: {
		/*
		{
			id: string
			resources: [
				{
					id: id in resources.json,
					amount: number of them to spawn
				}
			],
			position: {
				map: mapID,
				x: in tiles,
				y: in tiles,
			},
			size: {
				width: in pixels
				height: in pixels
			}
			mined: false,
			refresh: number in minuets of how long refreshes take,
			timer: a timer for the next refresh,
			currentResource: itemID,
			currentAmount: number of items
		}
		*/
	},
	loadedMaps: {},
	events: new process.EventEmitter(),

	init: function(){
		objectController.events.on('objectLoaded',this.loaded.bind(this))
	},
	getResource: function(id){

	},
	resourceLoaded: function(data){ //handels events from objectControler when a obj is loaded

	},
	resourceDeleted: function(data){

	},
	resourceCreated: function(data){

	},
	loadMap: function(mapID,cb){
		//load resources from map with id mapID
		db.query('SELECT url FROM maps WHERE id='+mapID,function(data){
			if(data.length){
				//read the files
				fs.readFile(data[0].url,function(err, file){
					if(err) throw err;

					json = JSON.parse(file);

					for (var k = 0; k < json.layers.length; k++) {
						if(json.layers[k].name == 'resources'){
							for (var i = 0; i < json.layers[k].objects.length; i++) {
								this.resource.add(json.layers[k].objects[i],mapID);
							};
						}
					};

					this.loadedMaps[mapID] = true;

					if(cb) cb(true);

				}.bind(this))
			}
			else{
				if(cb) cb(false);
			}
		}.bind(this))
	},
	getForMap: function(mapID,cb){
		//see if its loaded
		if(this.loadedMaps[mapID]){
			if(cb) cb(this.find('m('+mapID+')'));
		}
		else{
			this.loadMap(mapID,function(loaded){
				if(!loaded){
					if(cb) cb(false);
					return;
				}
				if(cb) cb(this.find('m('+mapID+')'));
			}.bind(this));
		}
	},
	getResource: function(map,x,y,cb){
		//see if its loaded
		if(this.loadedMaps[map]){
			if(cb) cb(this.find('m('+id+')x('+x+')y('+y+')'));
		}
		else{
			this.loadMap(map,function(loaded){
				if(!loaded){
					if(cb) cb(false);
					return;
				}
				if(cb) cb(this.find('m('+id+')x('+x+')y('+y+')'));
			}.bind(this));
		}
	},
	find: function(str){
		a = [];
		for(var i in this.resources){
			s = i.indexOf(str)
			if(s !== -1){
				a.push(this.resources[i]);
			}
		}
		return a;
	},
	resource: { //a obj for handling resources
		add: function(json,map){ //take a json obj from a map file and turns it into a resource obj
			a = []
			map = (map == undefined)? -1 : map;
			ids = json.properties.resources.trim().split(' ');
			amounts = json.properties.amount.trim().split(' ');
			for (var i = 0; i < ids.length; i++) {
				//see if this is a real resource
				if(dataFiles.resources[ids[i]] !== undefined){
					a.push({
						id: ids[i],
						amount: amounts[i] || amounts[0] || 0
					});
				}
			};
			//if there where no resources
			if(!a.length){
				return;
			}

			_resource = {
				id: 'm('+map+')x('+json.x+')y('+json.y+')',
				resourceIDs: a,
				position: {
					map: map,
					x: json.x,
					y: json.y
				},
				size: {
					width: json.width,
					height: json.height
				},
				mined: false,
				refresh: parseFloat(json.properties.refresh) || 1,
				timer: null,
				currentResource: '',
				currentAmount: 0
			};

			resources.resources['m('+_resource.position.map+')x('+_resource.position.x+')y('+_resource.position.y+')'] = _resource;
			
			resources.resource.refresh(_resource,true)
		},
		refresh: function(obj,silent){
			var copy = obj.resourceIDs.slice();
			for (var i = 0; i < obj.resourceIDs.length; i++) {
				index = Math.round(Math.random() * copy.length);
				if(index > copy.length-1) index = copy.length-1;
				
				var _resource = copy.slice(index,index+1)[0];
				chance = dataFiles.resources[_resource.id].spawnChance || 0;
				//see if it spawned
				if(Math.random()*100 <= chance){
					obj.mined = false
					obj.currentResource = _resource.id;
					obj.currentAmount = parseInt(_resource.amount);
			
					//send an event
					if(!silent){
						resources.events.emit('change',obj);
					}

					return;
				}
			};

			//if it has made it this far then it has not spawned
			obj.timer = setTimeout(_.partial(resources.resource.refresh, obj), 1000 * 60 * obj.refresh)
		},
		mine: function(obj,player){ //mine the resource and give it to the player and then set the timer
			obj.mined = true;
			item = dataFiles.resources[obj.currentResource].itemID;
			player.addItem(item,obj.currentAmount);

			//set the refresh timer
			obj.timer = setTimeout(_.partial(resources.resource.refresh, obj), 1000 * 60 * obj.refresh)
			
			//send an event
			resources.events.emit('change',obj);
		}
	}
}

//export
module.exports = resources;