dataFile = require('./dataFile.js')

module.exports = {
	files: [],

	load: function(url){
		console.info('loading: '+url)
		_f = new dataFile(url);
		this.files.push(_f);
		return _f;
	},
	saveAll: function(){
		for (var i = 0; i < this.files.length; i++) {
			this.files[i].save()
		};
	}
}