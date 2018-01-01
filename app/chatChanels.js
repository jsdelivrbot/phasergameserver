const { chatManager } = require("../modules/chat");
const commands = require("../modules/commands");

//add general chanel
chatManager.createChanel({
	title: "Genral",
	default: true,
	canLeave: false,
});
//create server chanel
chatManager
	.createChanel({
		title: "Server",
		canLeave: false,
	})
	.events.on("message", data => {
		let command = commands.parseCommandString(data.message);
		if (command) {
			commands.run(command.id, command.opts);
		}
	});

// logs
console._log = console.log;
console.log = (...args) => {
	console._log(...args);
	chatManager.message("Server", { message: args.join("") }, true);
};
