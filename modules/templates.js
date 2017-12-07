const EventEmitter = require("events");
const db = require("./db");

class Template {
	constructor(id, data) {
		this.id = id || -1;
		this.name = "";
		this.data = {};
		this.manager = null;

		if (data) {
			this.importData(data);
		}
	}

	importData(data = {}) {
		this.name = data.name;
		this.data = Object.assign({}, this.data, data.data);
		return this;
	}

	exportData() {
		return {
			id: this.id,
			name: this.name,
			data: this.data
		};
	}

	save() {
		if (this.manager) {
			this.manager.saveTemplate(this.id);
		}
	}
	remove() {
		if (this.manager) {
			this.manager.removeTemplate(this.id);
		}
	}
}

class TemplateManager {
	constructor() {
		/* events:
			templateChange: template
			templateDelete: id
			templateCreate: template
		*/
		this.events = new EventEmitter();
		this.templates = [];

		this.events.on("templateChange", function(data) {
			io.emit("templateChange", data);
		});
		this.events.on("templateCreate", function(data) {
			io.emit("templateCreate", data);
		});
		this.events.on("templateDelete", function(data) {
			io.emit("templateDelete", data);
		});
	}

	getTemplate(id) {
		if (this.templateLoaded(id)) {
			return this.templates.find(t => t.id === id);
		} else {
			return this.loadTemplate(id);
		}
	}
	getTemplates() {
		let templates = db.templates.find();
		return templates.map(data => this.getTemplate(data.id));
	}
	loadTemplate(id) {
		let template = new Template();
		template.manager = this;

		let data = db.templates.find({ id });
		if (data.length) {
			template.id = data[0].id;
			template.importData(data[0]);
			this.templates.push(template);
		}

		return template;
	}
	createTemplate(data) {
		let template = new Template(Math.round(Math.random() * 1000000), data);
		template.manager = this;

		db.templates.save(template.exportData());

		this.templates.push(template); //push it after it gets an id

		this.events.emit("templateCreate", template.exportData());

		template.save();

		return template;
	}
	deleteTemplate(id) {
		//fire the event
		this.events.emit("templateDelete", id);

		db.templates.remove({ id: id });

		this.removeTemplate(id);
	}
	templateLoaded(id) {
		return !!this.templates.find(t => t.id === id);
	}
	updateTemplate(id, data) {
		let template = this.getTemplate(id);
		template.importData(data);
		template.save();

		//fire the event
		this.events.emit("templateChange", template.exportData());
	}
	removeTemplate(id) {
		this.templates = this.templates.filter(template => template.id !== id);
	}
	saveTemplate(id) {
		let template = this.getTemplate(id);

		db.templates.update({ id }, template.exportData(), { upsert: true });
	}
	saveAll() {
		this.templates.forEach(t => t.save());
	}
}

let inst;
Object.defineProperty(TemplateManager, "inst", {
	get() {
		return inst || (inst = new TemplateManager());
	}
});
TemplateManager.inst.Template = Template;

module.exports = TemplateManager.inst;

const io = require("../server");
