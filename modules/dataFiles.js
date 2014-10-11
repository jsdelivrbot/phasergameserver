module.exports = Klass({
	files: [],

	load: function(url,required){
		console.info('loading: '+url)
		d = new DataFile(url,required)
		this.files.push(d);
		return d;
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
})