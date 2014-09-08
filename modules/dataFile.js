module.exports = Klass({
	url: '',
	relUrl: '',
	data: null,

	initialize: function(url,required){
		this.relUrl = url
		this.url = './data/'+url

		if(fs.existsSync(this.url)){
			this.data = fs.readFileSync(this.url,{encoding:'utf8'});
			this.data = JSON.parse(this.data);
		}
		else{
			console.error(this.url+' is missing')
			if(required){
				process.exit(1)
			}
		}
	},

	save: function(){
		console.log('writing file: ' + this.relUrl)
		fs.writeFileSync(this.url,JSON.stringify(this.data))
	}
})