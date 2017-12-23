const chat = require("../modules/chat");

//add general chanel
chat.createChanel({
	title: "Genral",
	default: true,
	canLeave: false
});
//create server chanel
chat
	.createChanel({
		title: "Server",
		canLeave: false
	})
	.events.on("message", data => {
		commands.readline.write(data.message + " \n");
	});

// logs
console._log = console.log;
console.log = (...args) => {
	console._log(...args);
	chat.message("Server", { message: args.join("") }, true);
};
