// module.exports = Klass({
// 	server: null,
// 	data: {
// 		info: null,
// 		maps: null
// 	},

// 	initialize: function(){

// 		//info json
// 		fs.readFile('data/info.json', _(function (err, data) {
// 		  	if (err) throw err;
// 		  	console.log('loaded server info');

// 		  	this.data.info = JSON.parse(data);
// 		}).bind(this))

// 		//maps json
// 		fs.readFile('data/maps.json', _(function (err, data) {
// 		  	if (err) throw err;
// 		  	console.log('loaded maps');

// 		  	this.data.maps = JSON.parse(data);
// 		}).bind(this))

// 		this.server = http.createServer(function (req, res) {
// 			res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});

// 			data = require('url').parse(req.url, true)

// 			switch(data.query.type){
// 				case 'info':
// 					json = fn.duplicate(dataServer.data.info)
// 					json.status = true
// 					json.numberOfPlayers = players.players.length;
// 					res.end(JSON.stringify(json))
// 					break;
// 				case 'map':
// 					//see if the var are there
// 					if(typeof data.query.island === 'undefined' || typeof data.query.map === 'undefined'){
// 						json = dataServer.error('no map info sent')
// 						res.end(JSON.stringify(json))
// 						return;
// 					}

// 					//get the map
// 					fs.readFile('data/'+dataServer.data.maps[data.query.island].maps[data.query.map].url, function (err, data) {
// 						if (err) throw err;

// 						res.end(data);
// 					});
// 					break;
// 				default:
// 					res.end(JSON.stringify(dataServer.error('did not reconsize that type')))
// 					break;
// 			}
// 		}).listen(8282, '127.0.0.1');
// 	},

// 	error: function(message){
// 		return {status: false, message: message || 'no message'};
// 	}
// })

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
			if(typeof data.query.island === 'undefined' || typeof data.query.map === 'undefined'){
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