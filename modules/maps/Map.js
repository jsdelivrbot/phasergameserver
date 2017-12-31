class Map {
	constructor(id, manager) {
		this.desc = "";
		this.width = 0;
		this.height = 0;
		// this.layers = [];
		this.url = "";
		this.name = "";
		this.id = id;
		this.manager = manager || null;

		this.saved = true;
		this.chunks = [];
		this.lastGet = new Date();
		this.loaded = false;
	}

	getChunk(x, y) {
		//gets chunk from array, cb is for when it loads
		let chunk = this.chunks.find(c => c.x === x && c.y === y);

		if (!chunk) {
			chunk = this.loadChunk(x, y);
		}

		return chunk;
	}
	chunkLoaded(x, y) {
		return !!this.chunks.find(c => c.x === x && c.y === y);
	}
	loadChunk(x, y) {
		let chunk = new Chunk(x, y, this);

		// if the chunk is off the map, just return it and dont bother storing it
		if (x < 0 && y < 0 && x >= this.width && y >= this.height) {
			return chunk;
		}

		this.chunks.push(chunk);
		let data = db.chunks.find({ x, y, map: this.id });
		if (data) {
			chunk.importData(data);
		}

		this.manager.events.emit(
			"chunkLoaded-" + chunk.x + "-" + chunk.y + "-" + chunk.map.id,
			chunk,
		);

		return chunk;
	}
	saveChunk(x, y) {
		let chunk = this.getChunk(x, y);

		if (chunk) {
			db.chunks.update({ id: chunk.id }, chunk.exportData(), { upsert: true });
		}
	}
	removeChunk(x, y) {
		this.chunks = this.chunks.filter(c => c.x !== x && c.y !== y);
	}
	unloadChunk(x, y) {
		this.saveChunk(x, y);
		this.removeChunk(x, y);
	}
	deleteChunk(x, y) {
		db.chunks.remove({ map: this.id, x, y });
		this.removeChunk(x, y);
	}
	saveAllChunks() {
		this.chunks.forEach(chunk => {
			this.saveChunk(chunk.x, chunk.y);
		});
	}
	deleteAllChunks() {
		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				this.deleteChunk(x, y);
			}
		}
	}

	importData(data) {
		//loads data from db format
		Object.assign(this, data);

		this.blank = false;
	}
	exportData() {
		//exports map into db format
		return {
			id: this.id,
			desc: this.desc,
			width: this.width,
			height: this.height,
			url: this.url,
			name: this.name,
		};
	}
}

module.exports = Map;
