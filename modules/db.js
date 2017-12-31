const path = require("path");
const db = require("diskdb");
const config = require("../config.json");

const database = db.connect(path.resolve(config.dataBase.path), [
	"players",
	"chunks",
	"maps",
	"tiles",
	"layers",
	"users",
	"userData",
	"errors",
	"objects",
	"templates",
]);

database.query = () => {};

module.exports = database;
