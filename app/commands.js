const templates = require("../modules/templates");
const commands = require("../modules/commands");
const { playerManager } = require("../modules/players");
const { mapManager } = require("../modules/maps");
const objectController = require("../modules/MapObjectManager");
const Command = commands.Command;

//this file creates all the command line commands
commands.addCommand(
	new Command({
		id: "stop",
		run: () => {
			commands.readline && commands.readline.close();

			objectController.saveAll();
			console.log("saved objects");

			mapManager.saveAllTileProperties();
			mapManager.saveAllChunks();
			mapManager.saveAllMaps();
			console.log("saved maps");

			playerManager.saveAll();
			console.log("saved players");

			templates.saveAll();
			console.log("saved templates");

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
					console.log("saved objects");

					mapManager.saveAllTileProperties();
					mapManager.saveAllChunks();
					mapManager.saveAllMaps();
					console.log("saved maps");

					playerManager.saveAll();
					console.log("saved players");

					templates.saveAll();
					console.log("saved templates");
				},
			}),
			new Command({
				id: "players",
				run: () => {
					playerManager.saveAll();
					console.log("saved players");
				},
			}),
			new Command({
				id: "maps",
				run: () => {
					objectController.saveAll();
					console.log("saved objects");

					mapManager.saveAllTileProperties();
					mapManager.saveAllChunks();
					mapManager.saveAllMaps();
					console.log("saved maps");
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
					playerManager.players.forEach(player =>
						console.log(player.userDate.name),
					);
				},
			}),
		],
	}),
);
