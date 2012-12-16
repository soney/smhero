var able = (function (root) {
var old_able = root.able;
var able = function () { };
able.version = "0.1.0";

able.noConflict = function() { root.able = able; return able; };


(function() {
	var listener_prop_name = "__listeners"
		, emit_fn_name = "_emit";

	able.make_this_listenable = function(instance) {
		instance[listener_prop_name] = {};
		instance.forward = function() {
			var args = toArray(arguments);
			var type = args[args.length-1];
			instance._emit.apply(instance, ([type]).concat(args.slice(0, args.length-1)));
		};
	};

	able.make_proto_listenable = function(proto) {
		proto.on = function(event_type, callback, context) {
			var listeners = this[listener_prop_name][event_type];
			if(!isArray(listeners)) {
				listeners = this[listener_prop_name][event_type] = [];
			}
			listeners.push({callback: callback, context: context});
			return this;
		};
		proto.off = function(event_type, callback) {
			var listeners = this[listener_prop_name][event_type];
			if(isArray(listeners)) {
				this[listener_prop_name][event_type] = filter(listeners, function(listener) {
					return listener.callback === callback;
				});
			}
			return this;
		};
		proto[emit_fn_name] = function(event_type) {
			var args = rest(arguments);
			args.push(event_type);
			each(this[listener_prop_name][event_type], function(listener) {
				var context = listener.context || this;
				listener.callback.apply(context, args);
			});
		};
	};
}());

(function() {
var options_prop_name = "__options"
	, emit_fn_name = "_emit";

able.make_this_optionable = function(instance) {
	instance[options_prop_name] = _.extend.apply(_, [{}].concat(_.rest(arguments)));
};

able.make_proto_optionable = function(proto) {
	proto._get_option = function(key) {
		var value = this[options_prop_name][key];
		if(isFunction(value)) {
			return value.call(this);
		} else {
			return value;
		}
	};
	proto._set_option = function(key, value) {
		this[options_prop_name][key] = value;
	};

	proto._on_option_set = function(key, value) { };
	proto._on_options_set = function(values) { };

	proto.option = function(key, value) {
		if(arguments.length === 0) {
			return this;
		} else if(isString(key)) {
			if(arguments.length === 1) {
				return this._get_option(key);
			} else {
				var args = rest(arguments, 2);
				this._set_option.apply(this, [key, value].concat(args));
				this._on_option_set.apply(this, [key, value].concat(args));

				var keys_val = {};
				keys_val[key] = value;
				this._on_options_set.apply(this, [keys_val].concat(args));

				return this;
			}
		} else {
			var args = rest(arguments, 1);
			each(key, function(v, k) {
				this._set_option.apply(this, [k, v].concat(args));
				this._on_option_set.apply(this, [k, v].concat(args));
			}, this);
			this._on_options_set.apply(this, [key].concat(args));
			return this;
		}
	};
};
}());

//
// ============== UTILITY FUNCTIONS ============== 
//
var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;
var slice = ArrayProto.slice,
	toString = ObjProto.toString,
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map;

// Is a given value an array?
// Delegates to ECMA5's native Array.isArray
var isArray = Array.isArray || function(obj) {
	return toString.call(obj) == '[object Array]';
};

// Retrieve the values of an object's properties.
var values = function(obj) {
	return map(obj, identity);
};
  
// Safely convert anything iterable into a real, live array.
var toArray = function(obj) {
	if (!obj)                                     return [];
	if (isArray(obj))                           return slice.call(obj);
	if (isArguments(obj))                       return slice.call(obj);
	if (obj.toArray && isFunction(obj.toArray)) return obj.toArray();
	return values(obj);
};

// Is a given value a function?
var isFunction = function(obj) {
	return toString.call(obj) == '[object Function]';
};

// Is a given variable a string?
var isString = function(obj) {
	return toString.call(obj) == '[object String]';
};

// Is a given variable an arguments object?
var isArguments = function(obj) {
	return toString.call(obj) == '[object Arguments]';
};

// Establish the object that gets returned to break out of a loop iteration.
var breaker = {};

var extend = function(obj) {
	var args = slice.call(arguments, 1)
		, i
		, len = args.length;
	for(i = 0; i<len; i++) {
		var source = args[i];
		for (var prop in source) {
			obj[prop] = source[prop];
		}
	}
	return obj;
};

var last = function(arr) {
	return arr[arr.length - 1];
};

var each = function(obj, iterator, context) {
	if (obj == null) { return; }
	if (nativeForEach && obj.forEach === nativeForEach) {
		obj.forEach(iterator, context);
	} else if (obj.length === +obj.length) {
		for (var i = 0, l = obj.length; i < l; i++) {
			if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) { return; }
		}
	} else {
		for (var key in obj) {
			if (has(obj, key)) {
				if (iterator.call(context, obj[key], key, obj) === breaker) { return; }
			}
		}
	}
};

var map = function(obj, iterator, context) {
	var results = [];
	if (obj == null) { return results; }
	if (nativeMap && obj.map === nativeMap) { return obj.map(iterator, context); }
	each(obj, function(value, index, list) {
		results[results.length] = iterator.call(context, value, index, list);
	});
	if (obj.length === +obj.length) { results.length = obj.length; }
	return results;
};

var nativeFilter = Array.prototype.filter;
var filter = function(obj, iterator, context) {
	var results = [];
	if (obj == null) { return results; }
	if (nativeFilter && obj.filter === nativeFilter) { return obj.filter(iterator, context); }
	var i, len = obj.length, value;
	for(i = 0; i<len; i++) {
		value = obj[i];
		if(iterator.call(context, value, i, obj)) { results.push(value); }
	}
	return results;
};
  
// Returns everything but the first entry of the array. Aliased as `tail`.
// Especially useful on the arguments object. Passing an **index** will return
// the rest of the values in the array from that index onward. The **guard**
// check allows it to work with `_.map`.
var rest = function(array, index, guard) {
	return slice.call(array, (index == null) || guard ? 1 : index);
};

var hasOwnProperty = Object.prototype.hasOwnProperty;
var has = function(obj, key) {
	return hasOwnProperty.call(obj, key);
};

/*
var construct = function(constructor, args) {
    var F = function() { return constructor.apply(this, args); }
    F.prototype = constructor.prototype;
    return new F();
};
var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;
var slice = ArrayProto.slice,
	toString = ObjProto.toString,
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map;


var camel_case = (function() {
	var rdashAlpha = /-([a-z]|[0-9])/ig, rmsPrefix = /^-ms-/;
	var fcamelCase = function(all, letter) {
		return String(letter).toUpperCase();
	};
	return function(string) {
		return string.replace( rmsPrefix, "ms-" ).replace(rdashAlpha, fcamelCase);
	};
}());

// Return a unique id when called
var uniqueId = (function() {
	var id = 0;
	return function() { return id++; };
}());

// Clone
var clone = function(obj) {
	if (!isObject(obj)) return obj;
	return isArray(obj) ? obj.slice() : extend({}, obj);
};

// Return the first item in arr where test is true
var index_where = function(arr, test, start_index) {
	var i, len = arr.length;
	if(isNumber(start_index)) {
		start_index = Math.round(start_index);
	} else {
		start_index = 0;
	}
	for(i = start_index; i<len; i++) {
		if(test(arr[i], i)) { return i; }
	}
	return -1;
};

//Bind a function to a context
var bind = function(func, context) {
	return function() { return func.apply(context, arguments); };
};

var eqeqeq = function(a, b) { return a === b; };
// Return the first item in arr equal to item (where equality is defined in equality_check)
var index_of = function(arr, item, start_index, equality_check) {
	equality_check = equality_check || eqeqeq;
	return index_where(arr, function(x) { return equality_check(item, x); }, start_index);
};

// Remove an item in an array
var remove = function(arr, obj) {
	var index = index_of(arr, obj);
	if(index>=0) { arr.splice(index, 1); }
};

// Remove every item from an array
var clear = function(arr) {
	arr.length = 0;
};
  
// Is a given value a number?
var isNumber = function(obj) {
	return toString.call(obj) == '[object Number]';
};

  
// Is a given value a DOM element?
var isElement = function(obj) {
	return !!(obj && (obj.nodeType === 1 || obj.nodeType === 8 || obj.nodeType === 3));
};
  


// Is a given variable an object?
var isObject = function(obj) {
	return obj === Object(obj);
};

  

// Set a constructor's prototype
var proto_extend = function (subClass, superClass) {
	var F = function() {};
	F.prototype = superClass.prototype;
	subClass.prototype = new F();
	subClass.prototype.constructor = subClass;
	
	subClass.superclass = superClass.prototype;
	if(superClass.prototype.constructor === Object.prototype.constructor) {
		superClass.prototype.constructor = superClass;
	}
};

var extend = function(obj) {
	var args = slice.call(arguments, 1)
		, i
		, len = args.length;
	for(i = 0; i<len; i++) {
		var source = args[i];
		for (var prop in source) {
			obj[prop] = source[prop];
		}
	}
	return obj;
};
var each = function(obj, iterator, context) {
	if (obj == null) { return; }
	if (nativeForEach && obj.forEach === nativeForEach) {
		obj.forEach(iterator, context);
	} else if (obj.length === +obj.length) {
		for (var i = 0, l = obj.length; i < l; i++) {
			if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) { return; }
		}
	} else {
		for (var key in obj) {
			if (has(obj, key)) {
				if (iterator.call(context, obj[key], key, obj) === breaker) { return; }
			}
		}
	}
};
var map = function(obj, iterator, context) {
	var results = [];
	if (obj == null) { return results; }
	if (nativeMap && obj.map === nativeMap) { return obj.map(iterator, context); }
	each(obj, function(value, index, list) {
		results[results.length] = iterator.call(context, value, index, list);
	});
	if (obj.length === +obj.length) { results.length = obj.length; }
	return results;
};




*/

return able;
}(this));
