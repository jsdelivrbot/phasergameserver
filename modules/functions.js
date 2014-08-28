module.exports = {
	combind: function(obj,obj2){
		for (var val in obj2){
			if(typeof obj2[val] !== 'object'){
				obj[val] = obj2[val]
			}
			else{
				if(typeof obj[val] == 'object'){
					obj[val] = fn.combind(obj[val],obj2[val])
				}
				else{
					obj[val] = fn.combind({},obj2[val])
				}
			}
		}

		return obj;
	},
	duplicate: function(obj2,count){
		if(typeof obj2 == 'object'){
			count = count || 4
			if(count > 0){
				// see if its an array
				if(obj2.hasOwnProperty('length')){
					var obj = []
					for (var i = 0; i < obj2.length; i++) {
						if(typeof obj2[i] !== 'object'){
							obj[i] = obj2[i]
						}
						else{
							obj[i] = fn.duplicate(obj2[i],count-1)
						}
					};
				}
				else{
					var obj = {}
					for (var i in obj2){
						if(typeof obj2[i] !== 'object'){
							obj[i] = obj2[i]
						}
						else{
							obj[i] = fn.duplicate(obj2[i],count-1)
						}
					}
				}
			}
			return obj;
		}
		else{
			return obj2
		}
	}
}