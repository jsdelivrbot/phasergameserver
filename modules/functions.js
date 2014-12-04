module.exports = {
	//cant use _.extend because it makes a shallow extend
	combindOver: function(obj,obj2){ //obj2 gose over obj, values that are not in obj are added
		for (var val in obj2){
			if(typeof obj2[val] !== 'object'){
				if(typeof obj[val] == "function"){
					obj[val](obj2[val])
				}
				else{
					obj[val] = obj2[val]
				}
			}
			else{
				if(typeof obj[val] == 'object'){
					obj[val] = fn.combindOver(obj[val],obj2[val])
				}
				else{
					obj[val] = fn.combindOver({},obj2[val])
				}
			}
		}

		return obj;
	},
	//cant use _.extend because it makes a shallow extend
	combindIn: function(obj,obj2){ //dont use when obj contains arrays, obj2 gose in obj, values that are not in obj are NOT added
		for (var val in obj){
			if(typeof obj2[val] !== 'undefined'){
				if(typeof obj[val] !== 'object'){
					obj[val] = obj2[val]
				}
				else if(typeof obj[val] == 'object'){
					obj[val] = fn.combindIn(obj[val],obj2[val])
				}
			}
		}

		return obj;
	},
	//cant use _.clone because it makes a shallow copy
	duplicate: function(obj2,count){
		if(typeof obj2 == 'object' && obj2 !== null){
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
	},
	diff: function (prev, now) {
	    var changes = {};
	    var prop = {};
	    var c = {};
	    // prev = prev || {}
	    //-----

	    for (prop in now) { //ignore jslint
	        if (prop.indexOf("_KO") > -1) {
	            continue; //ignore jslint
	        }

	        if (!prev || prev[prop] !== now[prop]) {
	            if (_.isArray(now[prop])) {
	                c = fn.diff(prev[prop],now[prop]);
	                if(!_.isEmpty(c)){
	                	changes[prop] = c;
	                }
	            }
	            else if (_.isObject(now[prop])){
	                // Recursion alert
	                if(prev[prop]){
	                	c = fn.diff(prev[prop], now[prop]);
		                if (!_.isEmpty(c)) {
		                    changes[prop] = c;
		                }
	                }
	                else{
	                	c = fn.duplicate(now[prop]);
	                    changes[prop] = c;
	                }
	            } else {
	                changes[prop] = now[prop];
	            }
	        }
	    }

	    return changes;
	},
	parseURL: function(url) {
	    var parser = document.createElement('a'),
	        searchObject = {},
	        queries, split, i;
	    // Let the browser do the work
	    parser.href = url;
	    // Convert query string to object
	    queries = parser.search.replace(/^\?/, '').split('&');
	    for( i = 0; i < queries.length; i++ ) {
	        split = queries[i].split('=');
	        searchObject[split[0]] = split[1];
	    }
	    return {
	        protocol: parser.protocol,
	        host: parser.host,
	        hostname: parser.hostname,
	        port: parser.port,
	        pathname: parser.pathname,
	        search: parser.search,
	        searchObject: searchObject,
	        hash: parser.hash
	    };
	},
	isDiff: function(prev, now){ //need to build real diff function first, because this dose not take into account remove indexes in arrays
	   //need building, needs to be light weight
	},
	getDiff: function(prev, now, str, diff){ //create a diff obj, that contains an array of values that changed and values that have been added/removed
		diff = diff || {
			changed: {},
			added: {},
			removed: {}
		};
		str = str || '';
		combindObj = fn.combindOver(fn.duplicate(prev),now);

		//find the values that have been added
		for(var i in combindObj){
			//see if it was added
			if(prev[i] == undefined){
				diff.added[str+i] = now[i];
			}
			//see if it was removed
			else if(now[i] == undefined){
				diff.removed[str+i] = prev[i];
			}
			//its on both objs, see if its an obj
			else{
				//see if they have the same type
				if(typeof prev[i] === typeof now[i]){
					//is it an object or an array
					if(_.isObject(prev[i])){
						fn.getDiff(prev[i],now[i],str+i+'.',diff);
					}
					else{
						//its a value or a function
						if(prev[i] !== now[i]){
							diff.changed[str+i] = now[i];
						}
					}
				}
				else{
					//they dont have the same type, overwrite the prev
					diff.changed[str+i] = now[i];
				}
			}
		}

		return diff;
	},
	applyDiff: function(obj, diff){ //applys the diff obj created by fn.getDiff
		diff = diff || {
			added: {},
			changed: {},
			removed: {}
		}

		//add
		for(var i in diff.added){
			fn.setValue(obj,i.split('.'),diff.added[i]);
		}
		//change
		for(var i in diff.changed){
			fn.setValue(obj,i.split('.'),diff.changed[i]);
		}
		//remove
		for(var i in diff.removed){
			fn.removeValue(obj,i.split('.'));
		}
	},
	setValue: function(obj,a,value){
		if(a.length == 1){
			obj[a[0]] = value;
			return value;
		}
		else{
			i = a.splice(0,1)[0];
			fn.setValue(obj[i],a,value);
		}
	},
	removeValue: function(obj,a){
		if(a.length == 1){
			delete obj[a[0]];
		}
		else{
			i = a.splice(0,1)[0];
			fn.setValue(obj[i],a);
		}
	}
}