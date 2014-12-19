dataFiles = {
	files: [
		{
			id: 'config',
			url: 'config.json'
		},
		{
			id: 'itemProfiles',
			url: 'data/shared/itemProfiles.json',
			onload: function(json){
				//parse the json
				dataFiles.items = fn.idArray(json,'title');
			}
		},
		{
			id: 'damageProfiles',
			url: 'data/shared/damageProfiles.json'
		},
		{
			id: 'resourceProfiles',
			url: 'data/shared/resourceProfiles.json',
			onload: function(json){
				//parse the json
				dataFiles.resources = fn.idArray(json,'time');
			}
		},
		{
			id: 'miningProfiles',
			url: 'data/shared/miningProfiles.json'
		}
	],
	load: function(cb){
		cb = _.after(this.files.length,cb);

		for (var i = 0; i < this.files.length; i++) {
			fs.readFile(this.files[i].url,{encoding: 'UTF-8'},function(id, i, err, data){
				this[id] = JSON.parse(data);

				if(this.files[i].onload !== undefined){
					this.files[i].onload(this[id]);
				}

				cb();
			}.bind(this,this.files[i].id,i))
		};
	}
}

//export
module.exports = dataFiles;