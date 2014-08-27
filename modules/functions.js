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
	}
}