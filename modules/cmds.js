//this file creates all the command line commands
module.exports = function(){
	Command = commands.Command;

	commands.addCommand(new Command({
		id: 'stop',
		run: function(){
			var cb = _.after(3,function(){
				console.timeLog('saved'.info);
				process.exit();
			});

			commands.readline.close();

			console.timeLog('saving maps...')
			maps.saveAll(cb);

			console.timeLog('saving players...')
			players.saveAll(cb);

			console.timeLog('saving objects...')
			objectController.unloadAll(cb);
		}
	}));

	commands.addCommand(new Command({
		id: 'save',
		commands: [
			new Command({
				id: 'all',
				run: function(){
					console.timeLog('saving...');
					players.saveAll(function(){
						console.timeLog('saved'.info)
					});
				}
			}),
			new Command({
				id: 'players',
				run: function(){
					console.timeLog('saving players...');
					players.saveAll(function(){
						console.timeLog('saved players')
					});
				}
			})
		]
	}))

	commands.addCommand(new Command({
		id: 'players',
		commands: [
			new Command({
				id: 'list',
				run: function(){
					for (var i = 0; i < players.players.length; i++) {
						console.timeLog(players.players[i].data.data.id.name);
					};
				}
			}),
			new Command({
				id: 'kick',
				opts: ['playerName'],
				run: function(opts){
					if(opts.playerName){
						//find the player
						for (var i = 0; i < players.players.length; i++) {
							if(players.players[i].data.data.id.name == opts.playerName){
								players.players[i].socket.conn.close();
								return;
							}
						};
					}
					console.timeLog('cant find player'.warn)
				}
			})
		]
	}))
}