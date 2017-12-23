var http = require("http");
var url = require("url");
var path = require("path");
var fs = require("fs");

dataServer = {
	server: null,
	maps: [],
	init: function() {
		//set up
		this.server = http
			.createServer(
				function(req, res) {
					res.setHeader("Access-Control-Allow-Origin", "*");
					res.setHeader("Content-Type", "application/json");

					_url = url.parse(req.url, true);
					switch (_url.query.type) {
						case "info":
							json = fn.duplicate(dataFiles.config.serverInfo);
							json.players = players.players.length;
							res.end(JSON.stringify(json));
							break;
						case "dataFile":
							switch (_url.query.file) {
								case "items":
									res.end(JSON.stringify(dataFiles.itemProfiles));
									break;
								case "resourceProfiles":
									res.end(JSON.stringify(dataFiles.resourceProfiles));
									break;
								case "damageProfiles":
									res.end(JSON.stringify(dataFiles.damageProfiles));
									break;
								case "miningProfiles":
									res.end(JSON.stringify(dataFiles.miningProfiles));
									break;
								default:
									res.statusCode = 400;
									res.end("dont know what that file is");
									break;
							}
							break;
						default:
							res.statusCode = 400;
							res.end(this.mapError("no query"));
					}
				}.bind(this),
			)
			.listen(8282);
	},
	mapError: function(message) {
		return JSON.stringify({ status: false, message: message || "no message" });
	},
};

module.exports = dataServer;
