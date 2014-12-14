dataFiles = {
	files: [
		{
			id: 'config',
			url: 'config.json'
		},
		{
			id: 'items',
			url: 'data/shared/items.json'
		},
		{
			id: 'damageProfiles',
			url: 'data/shared/damageProfiles.json'
		},
		{
			id: 'resourceProfiles',
			url: 'data/shared/resourceProfiles.json'
		},
		{
			id: 'miningProfiles',
			url: 'data/shared/miningProfiles.json'
		}
	],
	load: function(cb){
		cb = _.after(this.files.length,cb);

		for (var i = 0; i < this.files.length; i++) {
			fs.readFile(this.files[i].url,{encoding: 'UTF-8'},function(id, err, data){
				this[id] = JSON.parse(data);
				cb();
			}.bind(this,this.files[i].id))
		};
	}
}

//export
module.exports = dataFiles;