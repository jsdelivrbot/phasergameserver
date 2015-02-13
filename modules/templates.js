var events = require('events');
var sortedArray = require('./sortedArray.js');

templates = {
	Template: function(id,data){
		this.id = id || -1;
		this.name = '';
		this.useWorker = true;
		this.data = [];

		this.saved = true;

		this.inportData = function(data){
			if(typeof data.data == 'string'){
				data.data = JSON.parse(data.data);
			}

			delete data.id; //remove id so things dont get messed up

			fn.combindOver(this,data);
		}
		this.exportData = function(){
			return {
				id: this.id,
				name: this.name,
				data: this.data
			}
		}

		this.save = function(cb){
			templates.saveTemplate(this.id,cb);
		}
		this.remove = function(){
			templates.removeTemplate(this.id);
		}

		this.inportData(data);
	},

	saveTime: 5000,
	templates: new sortedArray([],function(a,b){
		if(a.id===b.id) return 0;
		if(a.id>b.id){
			return 1;
		}
		else{
			return -1;
		}
	}),
	/*
	events:
	templateChange: template
	templateDelete: id
	templateCreate: template
	templatePlace: {template,position}
	*/
	events: new events.EventEmitter(),

	init: function(){
		this.saveTemplateLoop(0);
	},
	getTemplate: function(id,cb){
		if(this.templateLoaded(id)){
			if(cb) cb(this.templates[this.templates.indexOf({id:id})]);
		}
		else{
			this.loadTemplate(id,cb);
		}
	},
	getTemplates: function(cb){
		db.query('SELECT id FROM `templates`',function(data){
			//get templates
			if(data.length){
				var templates = [];
				cb = _.after(data.length,cb || function(){});
				for (var i = 0; i < data.length; i++) {
					this.getTemplate(data[i].id,function(obj){
						templates.push(obj);
						cb(templates);
					})
				};
			}
			else{
				if(cb) cb([]);
			}
		}.bind(this));
	},
	loadTemplate: function(id,cb){
		var template = new this.Template();
		db.query('SELECT * FROM templates WHERE id='+db.ec(id),function(data){
			if(data.length){
				template.id = data[0].id;
				template.inportData(data[0]);
				this.templates.push(template);
			}
			if(cb) cb(template);
		}.bind(this))
	},
	createTemplate: function(data,cb){
		var template = new this.Template(-1,data);

		data = template.exportData();
		db.query('INSERT INTO `templates`() VALUES()',function(data){
			template.id = data.insertId;

			this.templates.push(template); //push it after it gets an id

			this.events.emit('templateCreate',template.exportData());

			template.save(function(){
				if(cb) cb(template);
			});
		}.bind(this))
	},
	deleteTemplate: function(id,cb){
		//fire the event
		this.events.emit('templateDelete',id);

		db.query('DELETE FROM `templates` WHERE id='+db.ec(id),function(data){
			if(this.templateLoaded(id)){
				this.removeObject(id);
			}
			if(cb) cb();
		}.bind(this))
	},
	placeTemplate: function(id,position,cb){ //places a template on the map
		position = fn.combindIn({
			x: 0,
			y: 0,
			map: 0,
			layer: 0
		},position);
	},
	templateLoaded: function(id,cb){
		return this.templates.indexOf({id:id}) !== -1;
	},
	updateTemplate: function(id,data){
		this.getTemplate(id,function(template){
			template.inportData(data);
			template.saved = false;
			//fire the event
			this.events.emit('templateChange',template.exportData());
		}.bind(this))
	},
	removeTemplate: function(id){
		i = this.templates.indexOf({id:id});
		if(i !== -1){
			this.templates.splice(i,1);
		}
	},
	saveTemplate: function(id,cb){
		this.getTemplate(id,function(template){
			template.saved = true;
			data = template.exportData();
			var str = 'UPDATE `templates` SET ';

			for (var i in data) {
				if(i=='id') continue;
				str += '`'+i+'`='+db.ec(data[i])+', '
			};
			str = str.substring(0,str.length-2);
			str += ' WHERE id='+db.ec(data.id);

			db.query(str,function(){
				if(cb) cb();
			})
		})
	},
	saveAll: function(cb){
		cb = _.after(this.templates.length+1,cb || function(){});
		for (var i = 0; i < this.templates.length; i++) {
			if(!this.templates[i].saved){
				this.templates[i].save(cb);
			}
			else{
				cb();
			}
		};
		cb();
	},
	remvoeAll: function(cb){
		cb = _.after(this.templates.length+1,cb || function(){});
		for (var i = 0; i < this.templates.length; i++) {
			if(!this.templates[i].saved){
				this.templates[i].remove();
			}
			else{
				cb();
			}
		};
		cb();
	},
	saveTemplateLoop: function(i){
		if(this.templates[i]){
			if(!this.templates[i].saved){
				this.templates[i].save();
			}

			if(++i >= this.templates.length){
				i = 0;
			}

			setTimeout(this.saveTemplateLoop.bind(this,i),this.saveTime);
			return;
		}
		setTimeout(this.saveTemplateLoop.bind(this,0),this.saveTime);
	}
}

module.exports = templates;