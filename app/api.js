const path = require("path");
const express = require("express");
const config = require("../config");
const playerManager = require("../modules/players/PlayerManager");

const api = express.Router();

api.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept",
	);
	next();
});

api.get(/\/(info|status)/i, (req, res) => {
	res
		.status(200)
		.send({
			...config.serverInfo,
			players: playerManager.players.length,
		})
		.end();
});

api.use(
	"/data",
	express.static(path.join(__dirname, "../data/shared"), {
		extensions: ["json"],
	}),
);

module.exports = api;
