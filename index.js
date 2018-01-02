const express = require("express");

require("./app/colors");
require("./app/chatChanels");
require("./app/commands");
const api = require("./app/api");
const createServer = require("./app/server");

const app = express();
const server = require("http").Server(app);
createServer(server);

app.use("/api", api);

app.get("/", (req, res) => {
	res.status(200).redirect("https://projects.rdfriedl.com/phasergameadmin");
});

const port = process.env.PORT || 8080;
server.listen(port);

// started
console.log(`Server started on port: ${port}`);

module.exports = app;

// save every 5 minuets
const templates = require("./modules/templates");
const playerManager = require("./modules/players/PlayerManager");
const mapManager = require("./modules/maps/MapManager");
const objectController = require("./modules/MapObjectManager");
setInterval(() => {
	objectController.saveAll();

	mapManager.saveAllTileProperties();
	mapManager.saveAllChunks();
	mapManager.saveAllMaps();

	playerManager.saveAll();

	templates.saveAll();
}, 5 * 60 * 1000);
