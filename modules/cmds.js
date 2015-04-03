//this file creates all the command line commands
module.exports = {
	console: function(){
		Command = commands.Command;

		commands.addCommand(new Command({
			id: 'stop',
			run: function(){
				commands.readline.close();

				var cb = _.after(4,function(){
					console.timeLog('saving players...')
					players.saveAll(function(){
						console.timeLog('saving templates...')
						templates.saveAll(function(){
							console.timeLog('saved'.success);
							process.exit();
						});
					});
				});

				console.timeLog('saving maps...')
				maps.saveAllMaps(cb);
				maps.saveAllChunks(cb);
				console.timeLog('saving objects...')
				objectController.saveAll(cb);
				maps.saveAllTileProperties(cb);
			}
		}));
		commands.addCommand(new Command({
			id: 'db',
			commands: [
				new Command({
					id: 'state',
					run: function(){
						console.timeLog(db.db.state[(db.db.state === 'authenticated')? 'success' : 'info']);
					}
				}),
				new Command({
					id: 'connect',
					run: function(){
						db.reconnect(function(){
							console.timeLog('opened'.success+' database connection')
						});
					}
				}),
				new Command({
					id: 'disconnect',
					run: function(){
						db.disconnect(function(){
							console.timeLog('closed'.info+' database connection')
						});
					}
				})
			]
		}))

		commands.addCommand(new Command({
			id: 'save',
			commands: [
				new Command({
					id: 'all',
					run: function(){
						var cb = _.after(4,function(){
							console.timeLog('saving players...')
							players.saveAll(function(){
								console.timeLog('saving templates...')
								templates.saveAll(function(){
									console.timeLog('saved'.success);
								});
							});
						});

						console.timeLog('saving maps...')
						maps.saveAllMaps(cb);
						maps.saveAllChunks(cb);
						console.timeLog('saving objects...')
						objectController.saveAll(cb);
						maps.saveAllTileProperties(cb);
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
				}),
				new Command({
					id: 'maps',
					run: function(){
						var cb = _.after(4,function(){
							console.timeLog('saved maps')
						})

						console.timeLog('saving maps...')
						maps.saveAllMaps(cb);
						maps.saveAllChunks(cb);
						console.timeLog('saving objects...')
						objectController.saveAll(cb);
						maps.saveAllTileProperties(cb);
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
						commands.printTitle('Players'.info+' Online');
						for (var i = 0; i < players.players.length; i++) {
							console.timeLog(players.players[i].userData.name);
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
}