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
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Access-Control-Allow-Origin', '*');

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
						res.end(this.mapError('no map data sent'));
						break;
					}

					id = data.query.map;

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
						db.query('select * from maps where id='+data.query.map,function(mapId,data){
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
						}.bind(this,data.query.map))
					}
					break;
				default: 
					res.statusCode = 400;
					res.end(this.mapError('no query'));
			}
		}.bind(this)).listen(8282);

		//maps json
		fs.readFile('data/maps.json', function (err, data) {
		  	if (err) throw err;
		  	console.log('loaded maps');

		  	this.data.maps = JSON.parse(data);
		}.bind(this))
	},
	mapError: function(message){
		return JSON.stringify({status: false, message: message || 'no message'});
	}
}

module.exports = dataServer;