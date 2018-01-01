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

app.get("/", (req, res) => {
	res.status(200).end("Server Running");
});

const port = process.env.PORT || 8080;
server.listen(port);

// started
console.log(`Server started on port: ${port}`);

module.exports = app;

// save every 5 minuets
const templates = require("../modules/templates");
const { playerManager } = require("../modules/players");
const { mapManager } = require("../modules/maps");
const objectController = require("../modules/MapObjectManager");
setInterval(() => {
	objectController.saveAll();

	mapManager.saveAllTileProperties();
	mapManager.saveAllChunks();
	mapManager.saveAllMaps();

	playerManager.saveAll();

	templates.saveAll();
}, 5 * 60 * 1000);
