const express = require("express");

require("./utils");
require("./chatChanels");
require("./commands");
const api = require("./api");
const createServer = require("./server");

const app = express();
const server = require("http").Server(app);
createServer(server);

app.use("/api", api);

const port = process.env.NODE_PORT || process.env.PORT || 8080;
server.listen(port);

// started
console.timeLog(
	`Server started on port: ${port}, type ` + "help".info + " or " + "?".info,
);

const commandManager = require("../modules/commands");
setInterval(() => {
	commandManager.runCommand("save.all");
}, 5 * 60 * 1000);

module.exports = app;
