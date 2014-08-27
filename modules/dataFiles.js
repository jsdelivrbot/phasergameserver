dataFile = require('./dataFile.js')

module.exports = {
	files: [],

	load: function(url){
		console.info('loading: '+url)
		_f = new dataFile(url);
		this.files.push(_f);
	},
	get: function(url){
		//see if we have it in cache
		for (var i = 0; i < this.files.length; i++) {
			if(url === this.files[i].relUrl){
				return this.files[i];
			}
		};
		return null;
	},
	saveAll: function(){
		for (var i = 0; i < this.files.length; i++) {
			this.files[i].save()
		};
	}
}