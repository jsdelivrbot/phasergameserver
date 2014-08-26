/*
{
	url: String,
	data: JSON,
	save: function
}
*/

fs = require('fs')
module.exports = function(url){
	this.relUrl = url
	this.url = './data/'+url

	if(fs.existsSync(this.url)){
		this.data = fs.readFileSync(this.url,{encoding:'utf8'});
		this.data = JSON.parse(this.data);
	}
	else{
		console.error(this.url+' is missing')
		process.exit(1)
	}

	this.save = function(){
		console.log('writing file: ' + this.relUrl)
		fs.writeFileSync(this.url,JSON.stringify(this.data))
	}

	return this
}