module.exports = Class.$extend({
	data: {
		id: {
			id: 0,
			name: '',
			email: '',
			passowrd: ''
		},
		position: {
			x: 0,
			y: 0,
			island: 0,
			map: 0
		},
		sprite: {
			image: '',
			animations: {
				animation: '',
				playing: false
			}
		}
	},

	__init__: function(_data){
		this.data = {}
		// put the data into this.data
		fn.combind(this.data,_data)
	},

	update: function(_data){
		// put the data into this.data
		fn.combind(this.data,_data)
	}
})