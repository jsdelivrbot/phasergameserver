URL = require('url');

dataServer = {
	server: null,
	data: {
		info: null,
		map: null
	},
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
					if(data.query.island === undefined || data.query.map === undefined || data.query.island < 0 || data.query.map < 0){
						json = this.error('no map info sent')
						res.end(JSON.stringify(json))
						return;
					}

					//get the map
					fs.readFile('data/'+this.data.maps[data.query.island].maps[data.query.map].url, function (err, data) {
						if (err) throw err;

						res.end(data);
					});
					break;
				default:
					res.end(JSON.stringify(this.error('did not reconsize that type')))
					break;
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
		return {status: false, message: message || 'no message'};
	}
}

module.exports = dataServer;