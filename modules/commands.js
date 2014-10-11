Command = Klass({
	key: '',
	cmd: null,
	initialize: function(key,cmd){
		this.key = key
		this.cmd = cmd
	},
	run: function(args,flags){
		if(this.cmd){
			return this.cmd(args,flags)
		}
		return false
	}
})

module.exports = Klass({
	commands: [],
	readline: null,
	initialize: function(){
		this.readline = readline.createInterface({
		  	input: process.stdin,
		  	output: process.stdout
		});
		this.readline.setPrompt('',0)
		this.readline.on('line',function(_cmd){
			// fix
			_cmd = _cmd.replace('  ',' ')

			cmd = _cmd.split(' ') || [_cmd]
			args = []
			flags = {}

			for (var i = 1; i < cmd.length; i++) {
				if(cmd[i].charAt(0) !== '-'){
					args.push(cmd[i])
				}
				else{
					flags[cmd[i]] = true
				}
			};

			commands.run(cmd[0],args,flags)
		})
		this.readline.on('SIGINT',function(){
			commands.run('stop')
		})

		// commands
		this.commands.push(new Command('players',function(args,flags){
			switch (args[0]){
				case 'list':
					console.log('--------players--------')
					if('-o' in flags){
						for (var i = 0; i < players.players.length; i++) {
							console.log(players.players[i].name)
						};
					}
					else{
						for (var i = 0; i < players.users.length; i++) {
							str = players.users[i].id.name
							for (var k = 0; k < players.players.length; k++) {
								if(players.users[i].id.id == players.players[k].id){
									str += ': online'
								}
							};
							console.log(str)
						};
					}
					console.log('-----------------------')
					break;
				default: 
					console.log('\nlist\n')
					break;
			}
		}))
		this.commands.push(new Command('stop',function(){
			console.log('saving data...')
			players.saveDownAll()
			console.log('done')
			process.exit()
		}))
	},
	run: function(cmd,args,flags){
		for (var i = 0; i < this.commands.length; i++) {
			if(this.commands[i].key == cmd){
				this.commands[i].run(args,flags)
				return;
			}
		};

		// cant find
		console.log('dont know the command: '+cmd)
	}
})