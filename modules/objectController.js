const EventEmitter = require("events");
const db = require("./db");

class MapObject {
	constructor(id = -1, type = "", data) {
		this.id = id;
		this.type = type;
		this.x = 0;
		this.y = 0;
		this.map = -1;
		this.width = 1;
		this.height = 1;
		this.properties = {};

		if (data) {
			this.importData(data);
		}
	}

	importData(data) {
		Object.assign(this, data, { id: this.id });
		return this;
	}
	exportData() {
		return {
			id: this.id,
			type: this.type,
			x: this.x,
			y: this.y,
			map: this.map,
			width: this.width,
			height: this.height,
			properties: this.properties
		};
	}

	save() {
		return this.manager.saveObject(this.id, this.type);
	}
	remove() {
		return this.manager.removeObject(this.id, this.type);
	}
	delete() {
		return this.manager.deleteObject(this.id, this.type);
	}
}

/*events:
	objectLoaded: obj
	objectChange: obj export
	objectDelete: {id: id, type: type}
	objectCreate: obj export
*/
class MapObjectManager {
	constructor() {
		this.events = new EventEmitter();
		this.objects = [];
	}
	objectLoaded(id, type) {
		return !!this.objects.find(obj => obj.id === id && obj.type === type);
	}
	getObject(id, type) {
		if (this.objectLoaded(id, type)) {
			return this.objects.find(obj => obj.id === id && obj.type === type);
		} else {
			return this.loadObject(id, type);
		}
	}
	getObjectsOnPosition(type, from = {}, to = {}) {
		let objects = db.objects.find({ type });

		return objects
			.map(object => {
				for (let i in from) {
					if (Object.hasOwnProperty(from, i) && Object.hasOwnProperty(to, i)) {
						if (object[i] < from[i] || object[i] > to[i]) {
							return this.getObject(object.id, type);
						}
					}
				}
			})
			.filter(obj => !!obj);
	}
	createObject(type, data) {
		let id = Math.round(Math.random() * 100000);
		let obj = new MapObject(id, type, data);
		obj.manager = this;
		this.objects.push(obj);

		db.objects.save(obj.exportData());

		//fire the event
		this.events.emit("objectCreate", obj.exportData());

		return obj;
	}
	removeObject(id, type) {
		this.objects = this.objects.filter(
			obj => obj.id !== id && obj.type !== type
		);
	}
	deleteObject(id, type) {
		this.events.emit("objectDelete", { id, type });

		db.objects.remove({ id, type });
		this.removeObject(id, type);
	}
	updateObject(id, type, data) {
		let obj = this.getObject(id, type);
		obj.importData(data);
		db.objects.update({ id, type }, obj.exportData(), { upsert: true });

		//fire the event
		this.events.emit("objectChange", obj.exportData());
	}
	loadObject(id, type) {
		let [data] = db.objects.get({ id, type });
		let obj = new MapObject(id, type, data);
		obj.manager = this;
		this.objects.push(obj);

		this.events.emit("objectLoaded", obj);

		return obj;
	}
	saveObject(id, type) {
		let obj = this.getObject(id, type);
		db.objects.update({ id, type }, obj.exportData(), { upsert: true });

		this.events.emit("objectSaved", obj);
	}
	saveAll() {
		this.objects.forEach(obj => obj.save());
	}
}

let inst;
Object.defineProperty(MapObjectManager, "inst", {
	get() {
		return inst || (inst = new MapObjectManager());
	}
});

module.exports = MapObjectManager.inst;
