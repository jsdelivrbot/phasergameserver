URL = require('url');

dataServer = {
	server: null,
	data: {
		info: null,
		map: null
	},
	maps: [],
	init: function(){
		//set up
		this.server = http.createServer(function (req, res) {
			res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});

			data = URL.parse(req.url, true)

			switch(data.query.type){
				case 'info':
					json = fn.duplicate(CONFIG.serverInfo)
					json.players = players.players.length;
					res.end(JSON.stringify(json))
					break;
				case 'map':
					//see if the var are there
					if(data.query.map === undefined || data.query.map < 0){
						json = this.error('no map info sent')
						res.end(JSON.stringify(json))
						break;
					}

					id = data.query.map;

					//get the url from the DB
					if(this.maps[id]){
						//its there, send it to the client
						fs.readFile(this.maps[id].url,function(err, data){
							if(err){
								json = this.error('failed to read the map file')
								res.end(JSON.stringify(json))
								throw err;
							}
							res.end(data);
						})
					}
					else{
						//its not there, load it
						db.query('select * from maps where id='+data.query.map,function(mapId,data){
							if(data.length){
								this.maps[id] = data[0];

								//send it back
								fs.readFile(this.maps[id].url,function(err, data){
									if(err){
										json = this.error('failed to read the map file')
										res.end(JSON.stringify(json))
										throw err;
									}
									res.end(data);
								}.bind(this))
							}
							else{
								json = this.error('failed to get map from server')
								res.end(JSON.stringify(json))
							}
						}.bind(this,data.query.map))
					}
					break;
				default: 
					res.statusCode = 404;
					res.end();
			}
		}.bind(this)).listen(8282);

		//maps json
		fs.readFile('data/maps.json', function (err, data) {
		  	if (err) throw err;
		  	console.log('loaded maps');

		  	this.data.maps = JSON.parse(data);
		}.bind(this))
	},
	error: function(message){
		console.log(message.error)
		return {status: false, message: message || 'no message'};
	}
}

module.exports = dataServer;