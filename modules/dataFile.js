fs = require('fs')
module.exports = function(url){
	url = './data/'+url

	this.url = url

	if(fs.existsSync(url)){
		this.data = fs.readFileSync(url,{encoding:'utf8'});
		this.data = JSON.parse(this.data);
	}
	else{
		console.error(url+' is missing')
		process.exit(1)
	}

	this.save = function(){
		fs.writeFileSync(this.url,JSON.stringify(this.data))
	}

	return this
}