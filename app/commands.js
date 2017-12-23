const templates = require("../modules/templates");
const commands = require("../modules/commands");
const players = require("../modules/players");
const maps = require("../modules/maps");
const objectController = require("../modules/objectController");
const Command = commands.Command;

//this file creates all the command line commands
commands.addCommand(
	new Command({
		id: "stop",
		run: () => {
			commands.readline.close();

			objectController.saveAll();
			console.timeLog("saved objects");

			maps.saveAllTileProperties();
			maps.saveAllChunks();
			maps.saveAllMaps();
			console.timeLog("saved maps");

			players.saveAll();
			console.timeLog("saved players");

			templates.saveAll();
			console.timeLog("saved templates");

			process.exit();
		},
	}),
);

commands.addCommand(
	new Command({
		id: "save",
		commands: [
			new Command({
				id: "all",
				run: () => {
					objectController.saveAll();
					console.timeLog("saved objects");

					maps.saveAllTileProperties();
					maps.saveAllChunks();
					maps.saveAllMaps();
					console.timeLog("saved maps");

					players.saveAll();
					console.timeLog("saved players");

					templates.saveAll();
					console.timeLog("saved templates");
				},
			}),
			new Command({
				id: "players",
				run: () => {
					players.saveAll();
					console.timeLog("saved players");
				},
			}),
			new Command({
				id: "maps",
				run: () => {
					objectController.saveAll();
					console.timeLog("saved objects");

					maps.saveAllTileProperties();
					maps.saveAllChunks();
					maps.saveAllMaps();
					console.timeLog("saved maps");
				},
			}),
		],
	}),
);

commands.addCommand(
	new Command({
		id: "players",
		commands: [
			new Command({
				id: "list",
				run: () => {
					commands.printTitle("Players".info + " Online");
					players.players.forEach(player => console.log(player.userDate.name));
				},
			}),
		],
	}),
);
