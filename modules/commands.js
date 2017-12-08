const EventEmitter = require("events");
const readline = require("readline");

/*
events

commandRun: commandID, opts obj
*/

class Command {
	constructor(id, opts, run, cmds) {
		let args = {};
		if (typeof id === "object") {
			args.id = id.id || "";
			args.opts = id.opts || [];
			args.run = id.run;
			args.commands = id.commands || [];
			args.hidden = id.hidden || false;
		} else {
			args.id = id || "";
			args.opts = opts || [];
			args.run = run;
			args.commands = cmds || [];
			args.hidden = false;
		}

		this.id = args.id;
		this.opts = args.opts; //array of strings that are used to build the opts objs
		this.hidden = args.hidden;
		this.commands = args.commands;

		if (typeof args.run === "function") {
			this.run = args.run;
		} else if (typeof args.run === "string") {
			this.run = () => {
				console.timeLog(args.run);
			};
		} else {
			this.run = () => {
				CommandManager.inst.printTitle(this.id.info + " Commands");

				let output = "";
				this.commands.filter(cmd => !cmd.hidden).forEach(cmd => {
					output += cmd.id;
					if (cmd.opts) {
						output += ": ";
						for (let k = 0; k < cmd.opts.length; k++) {
							output += "<" + cmd.opts[k] + "> ";
						}
					}
					output += "\n";
				});

				console.log(output);
			};
		}
	}

	getCommand(id) {
		if (typeof id === "string") {
			id = id.split(".");
		}

		for (let i = 0; i < this.commands.length; i++) {
			if (this.commands[i].id === id[0]) {
				id.shift();
				if (id.length) {
					return this.commands[i].getCommand(id);
				} else {
					return this.commands[i];
				}
			}
		}
	}
	addCommand(command) {
		this.commands.push(command);
	}
	removeCommand(id) {
		if (typeof id === "string") {
			id = id.split(".");
		}

		for (let i = 0; i < this.commands.length; i++) {
			if (this.commands[i].id === id[0]) {
				id.shift();
				if (id.length) {
					this.commands[i].removeCommand(id);
				} else {
					this.commands.splice(i, 1);
				}
			}
		}
	}
}

class CommandManager {
	constructor() {
		this.readline = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		this.events = new EventEmitter();
		this.commands = [];

		this.setup();
	}
	setup() {
		this.readline.setPrompt("");
		this.readline.on("line", cmd => {
			if (cmd !== "") {
				let command = this.parseCommandString(cmd);
				if (command) this.run(command.id, command.opts);
			}
			this.readline.prompt();
		});
		this.readline.on("SIGINT", () => this.run("stop"));
		this.readline.on("SIGTSTP", () => this.run("stop"));
		this.readline.on("SIGCONT", () => this.run("stop"));

		//add help commands
		this.addCommand(
			new Command({
				id: "help",
				run: () => {
					this.printTitle("Commands");

					let output = "";
					this.commands.filter(cmd => !cmd.hidden).forEach(cmd => {
						output += cmd.id;
						if (cmd.opts) {
							output += ": ";
							for (let k = 0; k < cmd.opts.length; k++) {
								output += "<" + cmd.opts[k] + "> ";
							}
						}
						output += "\n";
					});

					console.log(output);
				}
			})
		);
		this.addCommand(
			new Command({
				id: "?",
				hidden: true,
				run: () => this.run("help")
			})
		);
	}
	getCommand(id) {
		if (typeof id === "string") {
			id = id.split(".");
		}

		for (let i = 0; i < this.commands.length; i++) {
			if (this.commands[i].id === id[0]) {
				id.shift();
				if (id.length) {
					return this.commands[i].getCommand(id);
				} else {
					return this.commands[i];
				}
			}
		}
	}
	addCommand(command) {
		this.commands.push(command);
	}
	removeCommand(id) {
		if (typeof id === "string") {
			id = id.split(".");
		}

		for (let i = 0; i < this.commands.length; i++) {
			if (this.commands[i].id === id[0]) {
				id.shift();
				if (id.length) {
					this.commands[i].removeCommand(id);
				} else {
					this.commands.splice(i, 1);
				}
			}
		}
	}
	run(id, opts) {
		let command = this.getCommand(id);
		if (command) {
			opts = this.formatOpts(id, opts);
			command.run(opts);
			this.events.emit("commandRun", id, opts);
		} else {
			console.log("did not recognize that command".error);
		}
	}
	parseCommandString(commandString) {
		//returns a command id and a opts array
		let a = commandString.split(":");
		let commandID = "";
		let opts = [];
		if (a[0]) {
			commandID = a[0]
				.trim()
				.replace(/ +/g, " ")
				.replace(/ /g, ".");
		}
		if (a[1]) {
			opts = a[1]
				.trim()
				.replace(/ +/g, " ")
				.split(" ");
		}

		return {
			id: commandID,
			opts: opts
		};
	}
	formatOpts(command, opts = []) {
		//takes an array of opts and builds a obj based on a commands opts
		command = command instanceof Command ? command : this.getCommand(command);

		let obj = {};
		if (command) {
			for (let i = 0; i < opts.length; i++) {
				if (command.opts[i]) {
					obj[command.opts[i]] = opts[i];
				}
			}
		}
		return obj;
	}
	printTitle(str) {
		console.log("---------------[ " + str + " ]---------------");
	}
}

let inst;
Object.defineProperty(CommandManager, "inst", {
	get() {
		return inst || (inst = new CommandManager());
	}
});
CommandManager.inst.Command = Command;

module.exports = CommandManager.inst;
