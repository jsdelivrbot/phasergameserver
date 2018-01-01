const Layer = require("./Layer");

class Chunk {
	constructor(x, y, map) {
		this.x = x;
		this.y = y;
		this.map = map;

		this._layers = [];
		this.saved = true;
		this.lastGet = new Date();
		this.loaded = false;
	}

	get layers() {
		return (this._layers = this.manager.layers.map(layer => {
			return (
				this._layers.find(l => l.id === layer.id) || new Layer(layer.id, this)
			);
		}));
	}

	get manager() {
		return this.map && this.map.manager;
	}

	getLayer(i) {
		let layers = this.layers;

		if (layers[i]) {
			return layers[i];
		}

		return new Layer(-1, this);
	}
	layerExists(i) {
		return !!this.layers[i];
	}

	importData(data) {
		let layers = this.layers;

		if (Array.isArray(data.data)) {
			data.data.forEach((layerData, i) => {
				layers[i] && layers[i].importData(layerData);
			});
		}

		//load data
		this.x = data.x;
		this.y = data.y;
		this.map = this.manager.getMap(data.map) || this.map;

		return this;
	}
	exportData() {
		//exports chunk into db format
		return {
			x: this.x,
			y: this.y,
			map: this.map.id,
			data: this.layers.map(l => l.exportData()),
		};
	}
}

module.exports = Chunk;
