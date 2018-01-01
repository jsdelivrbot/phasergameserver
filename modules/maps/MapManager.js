const EventEmitter = require("events");
const db = require("../db");
const Map = require("./Map");

class MapManager extends EventEmitter {
	constructor() {
		super();

		this.defaultTile = 0;
		this.layers = [];
		this.maps = [];
		this.tileProperties = {};
		this.events = this;

		this.loadTileProperties();
		this.updateLayers();
	}

	loadTileProperties() {
		db.tiles.find().forEach(data => {
			this.tileProperties[data.id] = data;
		});
	}
	saveTileProperties(id) {
		let tile = this.tileProperties[id];

		if (tile) {
			db.tiles.update({ id }, tile, { upsert: true });
		}
	}
	tilePropertiesChange(data = []) {
		const mergeTile = tile =>
			Object.assign(
				{
					id: -1,
					blank: false,
					collision: false,
					collisionInfo: Object.assign(
						{
							right: 0,
							left: 0,
							top: 0,
							bottom: 0,
						},
						tile.collisionInfo || {},
					),
				},
				tile || {},
			);

		if (Array.isArray(data)) {
			let changedTiles = [];
			for (let i = 0; i < data.length; i++) {
				let tile = mergeTile(data[i]);

				this.tileProperties[tile.id] = tile;

				changedTiles.push(tile);
			}
			this.emit("tilePropertiesChange", changedTiles);
		} else {
			let tile = mergeTile(data);

			this.tileProperties[tile.id] = tile;

			this.emit("tilePropertiesChange", tile);
		}
	}

	getMapList() {
		return db.maps.find();
	}

	getMap(id) {
		return this.maps.find(map => map.id === id) || this.loadMap(id);
	}
	loadMap(id) {
		let map = new Map(id, this);

		let data = db.maps.find({ id })[0];
		if (data) {
			map.importData(data);
		}

		this.emit("mapLoaded-" + map.id, map);

		return map;
	}
	removeMap(id) {
		this.maps = this.maps.filter(map => map.id !== id);
	}
	getChunk(x, y, id) {
		let map = this.getMap(id);
		return map && map.getChunk(x, y);
	}
	getTile(x, y, layerId, mapId) {
		let map = this.getMap(mapId);
		let chunk = map && map.getChunk(Math.floor(x / 16), Math.floor(y / 16));
		let layer = chunk && chunk.getLayer(layerId);

		return (
			layer &&
			layer.getTile(x - Math.floor(x / 16) * 16, y - Math.floor(y / 16) * 16)
		);
	}
	getTiles(from = {}, to = {}, mapId) {
		//get tiles in a rect from a map
		from = Object.assign({ x: 0, y: 0, l: 0 }, from);
		to = Object.assign({}, from, to);
		to.x = to.x < from.x ? from.x : to.x;
		to.y = to.y < from.y ? from.y : to.y;
		to.l = to.l < from.l ? from.l : to.l;

		let data = {
			x: from.x,
			y: from.y,
			width: to.x - from.x + 1,
			height: to.y - from.y + 1,
			data: [],
		};

		for (let l = from.l; l <= to.l; l++) {
			for (let x = from.x; x <= to.x; x++) {
				for (let y = from.y; y <= to.y; y++) {
					let tile = this.getTile(x, y, l, mapId);

					if (!data.data[l]) {
						data.data[l] = [];
					}

					data.data[l].push(tile);
				}
			}
		}

		return data;
	}

	setTiles(data, dontFire) {
		//set tiles in a rect
		data = Object.assign(
			{
				x: 0,
				y: 0,
				width: 0,
				height: 0,
				data: [],
				primaryLayer: 0,
				map: -1,
				activeLayer: 0,
			},
			data,
		);

		let map = this.getMap(data.map);
		if (!map) return;

		for (let l = 0; l < data.data.length; l++) {
			let layerIndex = data.activeLayer + (l - data.primaryLayer);

			for (let i = 0; i < data.data[l].length; i++) {
				let x = data.x + (i - Math.floor(i / data.width) * data.width);
				let y = data.y + Math.floor(i / data.width);

				//see if its a -1 tile
				if (data.data[l][i] === -1) {
					continue;
				}

				let chunk = this.getChunk(Math.floor(x / 16), Math.floor(y / 16));
				let layer = chunk && chunk.getLayer(layerIndex);
				if (!layer) return;

				//set the tile to default tile if its out of the map
				if (x < 0 || y < 0 || x >= map.width * 16 || y >= map.height * 16) {
					data.data[l][i] = this.defaultTile;
				}

				layer.setTile(
					x - Math.floor(x / 16) * 16,
					y - Math.floor(y / 16) * 16,
					data.data[l][i],
				);
			}
		}

		if (!dontFire) {
			this.emit("tilesChange", data);
		}
	}

	saveMap(id) {
		let map = this.getMap(id);

		db.maps.update({ id }, map.exportData(), { upsert: true });
	}
	saveAllMaps() {
		this.maps.forEach(map => this.saveMap(map.id));
	}
	saveAllChunks() {
		this.maps.forEach(map => map.saveAllChunks());
	}
	saveAllTileProperties() {
		for (let id in this.tileProperties) {
			this.saveTileProperties(id);
		}
	}

	// db
	createMap(data) {
		let map = new Map(db.maps.count(), this);

		map.importData(data);

		this.maps.push(map);

		this.saveMap(map.id);

		this.emit("mapCreated", map.id);
		this.emitMapsChanged();
		return this;
	}
	deleteMap(id) {
		db.maps.remove({ id });
		this.emit("mapDeleted", id);
		this.emitMapsChanged();
		this.removeMap(id);
		return this;
	}
	createLayer(data) {
		db.layers.add(data);
		this.emit("layerCreated");
		return this.updateLayers();
	}
	deleteLayer(id) {
		db.layers.remove({ id });
		this.emit("layerDeleted");
		this.updateLayers(id);
		return this;
	}
	changeLayer(data) {
		if (!data.id) return;
		db.layers.update({ id: data.id }, data, { upsert: true });
		this.emit("layerUpdated", data);
		return this.updateLayers();
	}
	updateLayers() {
		this.layers = db.layers.find();

		this.emit("layersChange", this.layers);

		return this.layers;
	}

	emitMapsChanged() {
		this.emit("mapsChange", this.getMapList());
	}
}

let inst;
Object.defineProperty(MapManager, "inst", {
	get() {
		return inst || (inst = new MapManager());
	},
});

module.exports = MapManager;
