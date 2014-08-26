data = require('./data.js')
fs = require('fs')

module.exports = function(){
	this.json = data.get('maps/maps.json').data
	this.islands = json

	for (var i = 0; i < this.islands.length; i++) {
		for (var k = 0; k < this.islands[i].maps.length; k++) {
			this.islands[i].maps[k].data = fs.readFileSync('data/maps/'+this.islands[i].maps[k].url,{encoding:'utf8'})
		};
	};

	return this;
}