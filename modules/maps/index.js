const MapManager = require("./MapManager");
const Map = require("./Map");
const Chunk = require("./Chunk");
const Layer = require("./Layer");
const Tile = require("./Tile");

module.exports = {
	MapManager,
	Map,
	Chunk,
	Layer,
	Tile,
	mapManager: MapManager.inst,
};
