var isPrimitive = function(arg) {
  return !arg || _.isString(arg) || _.isNumber(arg) || _.isBoolean(arg) ||
    _.isDate(arg)
},

isObject = function(arg) {
  return !(isPrimitive(arg) || _.isArray(arg) || _.isFunction(arg))
},

isCollection = function(arg) {
  return !(isPrimitive(arg) || _.isFunction(arg))
}

log = function() {
	var arg = arguments[0];
	isCollection(arg) || _.isFunction(arg) ? 
		console.dir.apply(console, arguments) :
		console.log.apply(console, arguments);
};