var EventEmitter = require('events');
var readline = require('readline');

/*
events

commandRun: commandID, opts obj
*/

commands = {
	readline: readline.createInterface({
		input:process.stdin,
		output:process.stdout
	}),
	Command: function(id,opts,run,cmds){
		var obj = {};
		if(typeof id == 'object'){
			obj.id = id.id || '';
			obj.opts = id.opts || [];
			obj.run = id.run;
			obj.commands = id.commands || [];
			obj.hidden = id.hidden || false;
		}
		else{
			obj.id = id || '';
			obj.opts = opts || [];
			obj.run = run;
			obj.commands = cmds || [];
			obj.hidden = false;
		}

		this.id = obj.id;
		this.opts = obj.opts; //array of strings that are used to build the opts objs
		this.hidden = obj.hidden;
		this.commands = obj.commands;

		if(typeof obj.run == 'function'){
			this.run = obj.run;
		}
		else if(typeof obj.run == 'string'){
			this.run = function(string){
				console.timeLog(string);
			}.bind(this,obj.run)
		}
		else{
			this.run = function(){
				commands.printTitle(this.id.info+' Commands');
				var str = '';
				for (var i = 0; i < this.commands.length; i++) {
					if(!commands.commands[i].hidden){
						str += this.id+' '+this.commands[i].id;

						if(this.commands[i].opts){
							str += ': ';
							for (var k = 0; k < this.commands[i].opts.length; k++) {
								str += '<'+this.commands[i].opts[k]+'> '
							};
						}

						str += '\n';
					}
				};
				console.log(str);
			}.bind(this)
		}

		this.getCommand = function(id){
			if(typeof id == 'string'){
				id = id.split('.');
			}

			for (var i = 0; i < this.commands.length; i++) {
				if(this.commands[i].id === id[0]){
					id.splice(0,1);
					if(id.length){
						return this.commands[i].getCommand(id);
					}
					else{
						return this.commands[i];
					}
				}
			};
		};
		this.addCommand = function(command){
			this.commands.push(command);
		};
		this.removeCommand = function(id){
			if(typeof id == 'string'){
				id = id.split('.');
			}

			for (var i = 0; i < this.commands.length; i++) {
				if(this.commands[i].id === id[0]){
					id.splice(0,1);
					if(id.length){
						this.commands[i].removeCommand(id);
					}
					else{
						this.commands.splice(i,1);
					}
				}
			};
		};
	},
	events: new EventEmitter(),
	commands: [],
	init: function(){
		this.readline.setPrompt('');
		this.readline.on('line',function(cmd){
			if(cmd !== ''){
				var command = this.parseCommandString(cmd);
				if(command){
					this.run(command.id,command.opts);
				}
			}
			this.readline.prompt();
		}.bind(this));
		this.readline.on('SIGINT',function(){
			commands.run('stop');
		});
		this.readline.on('SIGTSTP',function(){
			commands.run('stop');
		});
		this.readline.on('SIGCONT',function(){
			commands.run('stop');
		});

		//add help commands
		this.addCommand(new this.Command({
			id: 'help',
			run: function(){
				commands.printTitle('Commands');
				var str = '';
				for (var i = 0; i < commands.commands.length; i++) {
					if(!commands.commands[i].hidden){
						str += commands.commands[i].id;

						if(commands.commands[i].opts){
							str += ': ';
							for (var k = 0; k < commands.commands[i].opts.length; k++) {
								str += '<'+commands.commands[i].opts[k]+'> '
							};
						}

						str += '\n';
					}
				};
				console.log(str);
			}
		}));
		this.addCommand(new this.Command({
			id: '?',
			hidden: true,
			run: function(){
				commands.run('help');
			}
		}));
	},
	getCommand: function(id){
		if(typeof id == 'string'){
			id = id.split('.');
		}

		for (var i = 0; i < this.commands.length; i++) {
			if(this.commands[i].id === id[0]){
				id.splice(0,1);
				if(id.length){
					return this.commands[i].getCommand(id);
				}
				else{
					return this.commands[i];
				}
			}
		};
	},
	addCommand: function(command){
		this.commands.push(command);
	},
	removeCommand: function(id){
		if(typeof id == 'string'){
			id = id.split('.');
		}

		for (var i = 0; i < this.commands.length; i++) {
			if(this.commands[i].id === id[0]){
				id.splice(0,1);
				if(id.length){
					this.commands[i].removeCommand(id);
				}
				else{
					this.commands.splice(i,1);
				}
			}
		};
	},
	run: function(id,opts){
		var command = this.getCommand(id);
		if(command){
			opts = commands.formatOpts(id,opts);
			command.run(opts);
			this.events.emit('commandRun',id,opts);
		}
		else{
			console.log('did not reconize that command'.error)
		}
	},
	parseCommandString: function(commandString){ //returns a command id and a opts array
		a = commandString.split(":");
		var commandID = '';
		var opts = [];
		if(a[0]){
			commandID = a[0].trim().replace(/ +/g,' ').replace(/ /g,'.');
		}
		if(a[1]){
			opts = a[1].trim().replace(/ +/g,' ').split(' ');
		}

		return {
			id: commandID,
			opts: opts
		}
	},
	formatOpts: function(command,opts){ //takes an array of opts and builds a obj based on a commands opts
		var command = (command instanceof commands.Command)? command : this.getCommand(command);
		var obj = {};
		opts = opts || [];
		if(command){
			for (var i = 0; i < opts.length; i++) {
				if(command.opts[i]){
					obj[command.opts[i]] = opts[i];
				}
			};
		}
		return obj;
	},
	printTitle: function(str){
		console.log('---------------[ '+str+' ]---------------');
	}
};

module.exports = commands;