var http = require("http");
var url = require("url");
var path = require("path");
var fs = require("fs");

dataServer = {
	server: null,
	maps: [],
	init: function(){
		//set up
		this.server = http.createServer(function (req, res) {
			res.setHeader('Access-Control-Allow-Origin', '*');
			res.setHeader('Content-Type', 'application/json');

			_url = url.parse(req.url, true)
			switch(_url.query.type){
				case 'info':
					json = fn.duplicate(dataFiles.config.serverInfo)
					json.players = players.players.length;
					res.end(JSON.stringify(json))
					break;
				case 'map':
					//see if the var are there
					if(_url.query.map === undefined || _url.query.map < 0){
						res.end(this.mapError('no map data sent'));
						break;
					}

					id = parseInt(_url.query.map);

					//get the url from the DB
					if(this.maps[id]){
						//its there, send it to the client
						fs.readFile(this.maps[id].url,function(err, file){
							if(err){
								res.end(this.mapError('cant find map file'));
								throw err;
							}
							res.end(JSON.stringify({
								status: true,
								data: JSON.parse(file)
							}));
						})
					}
					else{
						//its not there, load it
						db.query('select * from maps where id='+_url.query.map,function(mapId,data){
							if(data.length){
								this.maps[id] = data[0];

								//send it back
								fs.readFile(this.maps[id].url,function(err, file){
									if(err){
										res.end(this.mapError('cant find map file'));
									}
									else{
										res.end(JSON.stringify({
											status: true,
											data: JSON.parse(file)
										}));
									}
								}.bind(this))
							}
							else{
								res.end(this.mapError('map not in server'));
							}
						}.bind(this,_url.query.map))
					}
					break;
				case 'dataFile':
					switch(_url.query.file){
						case 'items':
							res.end(JSON.stringify(dataFiles.itemProfiles));
							break;
						case 'resourceProfiles':
							res.end(JSON.stringify(dataFiles.resourceProfiles));
							break;
						case 'damageProfiles':
							res.end(JSON.stringify(dataFiles.damageProfiles));
							break;
						case 'miningProfiles':
							res.end(JSON.stringify(dataFiles.miningProfiles));
							break;
						default:
							res.statusCode = 400;
							res.end('dont know what that file is');
							break;
					}
					break;
				default: 
					res.statusCode = 400;
					res.end(this.mapError('no query'));
			}
		}.bind(this)).listen(8282);
	},
	mapError: function(message){
		return JSON.stringify({status: false, message: message || 'no message'});
	}
}

module.exports = dataServer;