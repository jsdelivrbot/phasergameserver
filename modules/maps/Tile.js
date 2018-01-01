class Tile {
	constructor(x, y, tile, layer) {
		this.layer = layer;
		this.tile = tile || (layer && layer.manager.defaultTile);
		this.x = x || 0;
		this.y = y || 0;
	}

	setTileId(id) {
		this.tile = id;
		return this;
	}

	exportData() {
		return this.tile;
	}

	importData(id) {
		this.tile = id;
	}

	get position() {
		return {
			x: this.chunk.x * 16 + this.x,
			y: this.chunk.y * 16 + this.y,
		};
	}

	get chunk() {
		return this.layer && this.layer.chunk;
	}

	get mapX() {
		return this.position.x;
	}
	get mapY() {
		return this.position.y;
	}
}

module.exports = Tile;
