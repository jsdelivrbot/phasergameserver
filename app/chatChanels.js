const { chatManager } = require("../modules/chat");

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
		commands.readline.write(data.message + " \n");
	});

// logs
console._log = console.log;
console.log = (...args) => {
	console._log(...args);
	chatManager.message("Server", { message: args.join("") }, true);
};
