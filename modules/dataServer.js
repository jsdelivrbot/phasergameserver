URL = require('url');

dataServer = {
	server: null,
	data: {
		info: null,
		map: null
	},
	error: function(message){
		return {status: false, message: message || 'no message'};
	}
}

//set up
dataServer.server = http.createServer(function (req, res) {
	res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});

	data = URL.parse(req.url, true)

	switch(data.query.type){
		case 'info':
			json = fn.duplicate(dataServer.data.info)
			json.status = true
			json.numberOfPlayers = players.players.length;
			res.end(JSON.stringify(json))
			break;
		case 'map':
			//see if the var are there
			if(data.query.island === undefined || data.query.map === undefined || data.query.island < 0 || data.query.map < 0){
				json = dataServer.error('no map info sent')
				res.end(JSON.stringify(json))
				return;
			}

			//get the map
			fs.readFile('data/'+dataServer.data.maps[data.query.island].maps[data.query.map].url, function (err, data) {
				if (err) throw err;

				res.end(data);
			});
			break;
		default:
			res.end(JSON.stringify(dataServer.error('did not reconsize that type')))
			break;
	}
}).listen(8282);

//info json
fs.readFile('data/info.json', function (err, data) {
  	if (err) throw err;
  	console.log('loaded server info');

  	dataServer.data.info = JSON.parse(data);
})

//maps json
fs.readFile('data/maps.json', function (err, data) {
  	if (err) throw err;
  	console.log('loaded maps');

  	dataServer.data.maps = JSON.parse(data);
})

module.exports = dataServer;