const path = require("path");
const express = require("express");
const config = require("../config");

const api = express.Router();

api.get(/\/(info|status)/i, (req, res) => {
	res
		.status(200)
		.send(config.serverInfo)
		.end();
});

api.use(
	"/data",
	express.static(path.join(__dirname, "../data/shared"), {
		extensions: ["json"],
	}),
);

module.exports = api;
