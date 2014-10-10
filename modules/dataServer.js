module.exports = Klass({
	server: null,
	data: {
		info: null,
		maps: null
	},

	initialize: function(){
		this.data.info = dataFiles.load('info.json',true)
		this.data.maps = dataFiles.load('maps.json',true)

		this.server = http.createServer(function (req, res) {
			res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});

			data = require('url').parse(req.url, true)

			switch(data.query.type){
				case 'info':
					json = fn.duplicate(dataServer.data.info.data)
					json.status = true
					json.numberOfPlayers = players.players.length;
					res.end(JSON.stringify(json))
					break;
				case 'map':
					//see if the var are there
					if(typeof data.query.island === 'undefined' || typeof data.query.map === 'undefined'){
						json = dataServer.error('no map info sent')
						res.end(JSON.stringify(json))
						return;
					}

					//get the map
					fs.readFile('data/'+dataServer.data.maps.data[data.query.island].maps[data.query.map].url, function (err, data) {
						if (err) throw err;

						res.end(data);
					});
					break;
				default:
					res.end(JSON.stringify(dataServer.error('did not reconsize that type')))
					break;
			}
		}).listen(8282, '127.0.0.1');
	},

	error: function(message){
		return {status: false, message: message || 'no message'};
	}
})