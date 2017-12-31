const Tile = require("./Tile");

class Layer {
	constructor(id, chunk) {
		this.id = id;
		this.chunk = chunk;
		this.width = 16;
		this.height = 16;

		this.tiles = new Array(this.width * this.height)
			.fill(this.manager.defaultTile)
			.map((id, i) => {
				return new Tile(
					i - Math.floor(i / this.width) * this.width,
					Math.floor(i / this.width),
					id,
					this,
				);
			});
	}

	get manager() {
		return this.chunk && this.chunk.manager;
	}

	getTile(x, y) {
		return this.tiles[y * this.width + x];
	}
	setTile(x, y, id) {
		return this.getTile(x, y).setTileId(id);
	}

	importData(data) {
		if (Array.isArray(data)) {
			data.forEach((tileData, i) => {
				this.tiles[i].importData(tileData);
			});
		}
	}
	exportData() {
		return this.tiles.map(tile => tile.exportData());
	}
}

module.exports = Layer;
