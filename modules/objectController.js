var events = require('events');
var sortedArray = require('./sortedArray.js');

objectController = {
	Object: function(id,type,data){
		this.id = id || -1;
		this.type = type || '';
		this.x = 0;
		this.y = 0;
		this.map = -1;
		this.width = 1;
		this.height = 1;
		this.properties = {};

		this.saved = true;

		this.inportData = function(data){
			if(typeof data.properties == 'string'){
				data.properties = JSON.parse(data.properties);
			}

			delete data.id; //remove id so things dont get messed up

			fn.combindOver(this,data);
		}
		this.exportData = function(){
			return {
				id: this.id,
				type: this.type,
				x: this.x,
				y: this.y,
				map: this.map,
				width: this.width,
				height: this.height,
				properties: this.properties
			}
		}

		if(data){
			this.inportData(data);
		}

		//short hands
		this.save = function(cb){
			objectController.saveObject(this.id,this.type,cb);
		}
		this.remove = function(){
			objectController.removeObject(this.id,this.type);
		}
		this.delete = function(cb){
			objectController.deleteObject(this.id,this.type,cb);
		}
	},

	saveTime: 1000,
	objects: new sortedArray([],function(a,b){
		if(a.id === b.id && a.type === b.type) return 0;

		if(a.id > b.id || a.type > b.type){
			return 1;
		}
		else{
			return -1
		}
	}),

	/*
	events:
	objectChange: obj export
	objectDelete: {id: id, type: type}
	objectCreate: obj export
	*/
	events: new events.EventEmitter(),

	init: function(){
		this.saveObjectLoop(0);

		this.events.on('objectCreate',function(data){
			io.emit('objectCreate',data);
		})

		this.events.on('objectChange',function(data){
			io.emit('objectChange',data);
		})

		this.events.on('objectDelete',function(data){
			io.emit('objectDelete',data);
		})
	},
	getObject: function(id,type,cb){ //gets a obj from the array
		if(this.objectLoaded(id,type)){
			if(cb) cb(this.objects[this.objects.indexOf({id:id,type:type})]);
		}
		else{
			this.loadObject(id,type,cb);
		}
	},
	/*{
		x: number,
		y: number,
		map: mapID
	}*/
	getObjectsOnPosition: function(type,from,to,cb){
		from = from || {id:0}; //give it a propertie so the sql dose not mess up
		to = to || from;
		this.typeExists(type,function(exists){
			if(exists){
				var sql = 'SELECT id FROM '+db.ecID('object-'+type)+' WHERE ';
				for (var i in from) {
					sql += db.ecID(i)+' BETWEEN '+db.ec(from[i])+' AND '+db.ec(to[i]);
					sql += ' AND ';
				};
				sql = sql.substring(0,sql.length-5);
				db.query(sql,function(data){
					//get objs
					if(data.length){
						var objs = [];
						cb = _.after(data.length,cb || function(){});
						for (var i = 0; i < data.length; i++) {
							this.getObject(data[i].id,type,function(obj){
								objs.push(obj);
								cb(objs);
							})
						};
					}
					else{
						if(cb) cb([]);
					}
				}.bind(this));
			}
			else{
				if(cb) cb([]);
			}
		}.bind(this))
	},
	createObject: function(type,data,cb){ //creates an obj and inserts it into the db
		var obj = new objectController.Object(-1,type,data); //set to -1 becuase its no loaded yet
		//insert into array
		this.objects.push(obj);
		//save
		var sql = 'INSERT INTO `object-'+obj.type+'`(`x`, `y`, `map`, `width`, `height`, `properties`) VALUES ('+db.ec(obj.x)+','+db.ec(obj.y)+','+db.ec(obj.map)+','+db.ec(obj.width)+','+db.ec(obj.height)+','+db.ec(obj.properties)+')';
		this.typeExists(type,function(exists){
			if(exists){
				db.query(sql,function(data){
					obj.id = data.insertId;

					//fire the event
					this.events.emit('objectCreate',obj.exportData());
					
					if(cb) cb(obj);
				}.bind(this))
			}
			else{
				if(cb) cb(obj);
			}
		}.bind(this))
	},
	removeObject: function(id,type){ //removes obj from array
		i = this.objects.indexOf({id:id,type:type});
		if(i !== -1){
			this.objects.splice(i,1);
		}
	},
	deleteObject: function(id,type,cb){ //remove obj from db
		this.typeExists(type,function(exists){
			if(exists){
				//fire the event
				this.events.emit('objectDelete',{id:id,type:type});

				db.query('DELETE FROM '+db.ecID('object-'+type)+' WHERE id='+db.ec(id),function(data){
					if(this.objectLoaded(id,type)){
						this.removeObject(id,type);
					}
					if(cb) cb();
				}.bind(this))
			}
			else{
				if(cb) cb();
			}
		}.bind(this));
	},
	objectLoaded: function(id,type){ //checks to see if the obj is loaded
		return this.objects.indexOf({id:id,type:type}) !== -1;
	},
	updateObject: function(id,type,data){ //updates objs data and fires event
		this.getObject(id,type,function(obj){
			obj.inportData(data);
			obj.saved = false;
			//fire the event
			this.events.emit('objectChange',obj.exportData());
		}.bind(this))
	},
	typeExists: function(type,cb){ //checks to see if a type of object exists in the db
		db.query("SHOW TABLES LIKE "+db.ec('object-'+type),function(data){
			if(cb) cb(data.length > 0);
		})
	},
	loadObject: function(id,type,cb){
		var obj = new this.Object(-1,type);
		this.typeExists(type,function(exists){
			if(exists){
				db.query('SELECT * FROM '+db.ecID('object-'+type)+' WHERE id='+db.ec(id),function(data){
					if(data.length){
						obj.id = data[0].id;
						obj.inportData(data[0]);
						this.objects.push(obj);
					}
					if(cb) cb(obj);
				}.bind(this))
			}
			else{
				if(cb) cb(obj);
			}
		}.bind(this))
	},
	saveObject: function(id,type,cb){
		this.getObject(id,type,function(obj){
			//see if the type of obj exists in the db
			this.typeExists(type,function(exists){
				if(exists){
					obj.saved = true;
					obj = obj.exportData();
					var str = 'UPDATE '+db.ecID('object-'+type)+' SET ';

					for (var i in obj) {
						if(i=='type') continue;
						str += '`'+i+'`='+db.ec(obj[i])+', '
					};
					str = str.substring(0,str.length-2);
					str += ' WHERE id='+db.ec(id);

					db.query(str,function(){
						if(cb) cb();
					})
				}
				else{
					if(cb) cb();
				}
			})
		}.bind(this))
	},
	saveAll: function(cb){
		db.reconnect(function(){
			cb = _.after(this.objects.length+1,cb);
			for (var i = 0; i < this.objects.length; i++) {
				if(!this.objects[i].saved){
					this.objects[i].save(cb);
				}
				else{
					cb();
				}
			};
			cb();
		}.bind(this))
	},
	saveObjectLoop: function(i){
		//find the x,y of the chunk based off the index
		if(this.objects[i]){
			if(!this.objects[i].saved){
				this.objects[i].save();
			}

			if(++i >= this.objects.length){
				i = 0;
			}

			setTimeout(this.saveObjectLoop.bind(this,i),this.saveTime);
			return;
		}
		setTimeout(this.saveObjectLoop.bind(this,0),this.saveTime);
	}
}

module.exports = objectController;