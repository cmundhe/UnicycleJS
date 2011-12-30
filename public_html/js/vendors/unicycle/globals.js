var Core = {},

// Internal properties and methods
// -----------------------------------------------------------------------------
arrayProto = Array.prototype;

slice = function(list, begin, end) {
	return arrayProto.slice.call(list, begin, end);
},

// Array add methods.
arrayAddFns = ['push', 'splice', 'unshift'],

// localStorage methods.
localStorageFns = ['key', 'getItem', 'setItem', 'remove', 'clear'];

// Request methods.
requestFns = ['get', 'post', 'put', 'delete'];

// Underscore proxy methods.
underscoreFns = ['all', 'any', 'detect', 'each', 'filter', 'foldr', 'groupBy',
  'inject', 'include', 'invoke', 'map', 'max', 'min', 'pluck', 'reduce',
  'reduceRight', 'reject', 'select', 'size', 'sortBy', 'sortedIndex', 'toArray'];

// Escape regular expression metacharacters in a string.
escRegExp = (function(){
  var metachars = '\\.+*?[^]$(){}=!<>|:';
      regExp    = RegExp('['+arrayProto.join.call(metachars,'\\')+']','g');
      subStr    = '\\$&';
  return function(str){
    return str.replace(regExp, subStr);
  }
})(),

// Object manipulation
// -----------------------------------------------------------------------------
// Underscore's extend, modified to protect against changes to Object.prototype.
extend = function(target) {
  var source, key, val, i;
  for (i = 1; source = arguments[i]; i++) {
    for (key in (source = arguments[i])) {
    val = source[key];
    // Protect against changes to Object.prototype.
    Object.prototype[key] === val || 
      val === undefined || 
      (target[key] = val);
    }
  }
  return target;
},

// Mixin a list of method names by means of a proxy function.
// Useful for emulating multiple inheritance (kind of).
mixin = function(obj, fns, proxy) {
  var fn  = fns.shift();
  if (fn != null) {
    obj[fn] = _.isFunction(proxy) ?
      function() { return proxy.call(this, fn, slice(arguments)) } :
      proxy[fn];
    mixin(obj, fns, proxy);
  }
},

// Crockford-style Object.create.
create = (function(F) {
	return function(proto, props) {
		F.prototype = proto;
		return extend(new F(), props);
	}
})(function(){}),


// Type checks
// -----------------------------------------------------------------------------

// True if string, number, boolean, date, undefined, null, or NaN.
isPrimitive = function(arg) {
  return !arg || _.isString(arg) || _.isNumber(arg) || _.isBoolean(arg) ||
    _.isDate(arg)
},

// True if generic object.
isObject = function(arg) {
  return !(isPrimitive(arg) || _.isArray(arg) || _.isFunction(arg))
},

// True if array or a non-function object.
isCollection = function(arg) {
  return !(isPrimitive(arg) || _.isFunction(arg))
},

// True if instance of ViewModel.
isViewModel = function(arg) {
  return arg instanceof Unicycle.core.ViewModel
},

// True if instance of ViewModelArray
isViewModelArray = function(arg) {
  return arg instanceof Unicycle.core.ViewModelArray
},

// True if instance of ViewModel or ViewModelArray.
isViewData = function(arg) {
  return isViewModel(arg) || isViewModelArray(arg)
},

// Debugging
// -----------------------------------------------------------------------------

log = function() {
	var arg = arguments[0];
	isCollection(arg) || _.isFunction(arg) ? 
		console.dir.apply(console, arguments) :
		console.log.apply(console, arguments);
},


// View data mixins
// -----------------------------------------------------------------------------

ViewDataStatic = {
  
  // Properties
  // ---------------------------------------------------------------------------
  dontEnum : null,
  events   : {},

  // Methods
  // ---------------------------------------------------------------------------
  // Build url through parent chain if view data is not root or does not begin
  // with '/'.
  getUrl : function(viewData) {
    var dontEnum = this.dontEnum,
        url      = viewData.url;
    return viewData == viewData[dontEnum+'app'] || url.match(/^\//) ? 
      url : 
      this.getUrl(viewData[dontEnum+'parent']) + url;
  },
  // True if attribute is not 'constructor' or begins with dontEnum prefix.
  isEnum : function(attribute){
      return _.isString(attribute) &&
        attribute != 'constructor' &&
        !attribute.match('^'+escRegExp(this.dontEnum));
  },
  // Invoke a function that may modify view data, refresh any dependent
  // attributes, render view, and call callback. Wraps all event handlers.
  // Can recursively call as many callbacks as supplied.
  invoke : function(viewData, fn) {
    
    var static      = this,
        previous    = static.strip(viewData, true),
        changedKeys = [], 
        callback, prevVal;
        
    callback = fn.call(viewData);
        
    // Determine which keys have changed, if any.
    _.each(viewData, function(val, key) {
      prevVal = previous[key];
      static.isEnum(key) &&
        !(val === prevVal || 
        (isObject(val)  || isViewModel(val)) 
          && isObject(prevVal) ||
        (_.isArray(val) || isViewModelArray(val)) 
          && _.isArray(prevVal) && val.length == prevVal.length) &&
        changedKeys.push(key);
    });
    
    _.each(previous, function(val, key) {
      !viewData.hasOwnProperty(key) && 
        changedKeys.push(key);
    });
    
    // If keys have changed, report and render.
    if (changedKeys.length) {
      viewData._report(changedKeys);
      callback !== false &&
        viewData._view.render();
    }
    
    // Invoke callback.
    _.isFunction(callback) && 
      static.invoke(viewData, callback);
    
    return changedKeys;
  },
  // Return an object containing enumerable key/values of passed view data.
  // If shallow, copy view data with object references stripped to {},
  // and arrays references stripped to arrays of same length.
  strip : function(viewData, shallow) {
    var obj = {};
    _.each(viewData, function(val, key){
      if (viewData.hasOwnProperty(key) && this.isEnum(key)) {
        if (shallow) {
          obj[key] = val instanceof Array ? 
            Array(val.length) : 
            isObject(val) ? {} : val
        } else {
          obj[key] = val;
        }
      }
    }, this);
    return obj;
  },
  // AJAX.
  sync : function(type, settings) {
    
    type = type.toUpperCase();
    
    var params  = extend({
      contentType : 'application/json',
      dataType    : 'json',
      processData : type == 'GET',
      type        : type 
    }, settings);
    
    // Make the request.
    return $.ajax(params);
	}
  
},

ViewDataProto = extend({
  
  // Properties
  // ---------------------------------------------------------------------------
  app    : null,
  obs    : null,
  parent : null,
  view   : null,

  // Methods
  // ---------------------------------------------------------------------------
  observe : function(subject, keys, viewModel) {
    viewModel || (viewModel = this);
    _.isArray(keys) || (keys = keys.split(' '));
    var obsKey = this.constructor.dontEnum+'obs';
        obs    = this[obsKey] || (this[obsKey] = {}),
        i = 0, l = keys.length;
    obs[subject] || (obs[subject] = []);
    while (i < l)
      obs[subject].push({key: keys[i++], viewModel: viewModel});
    return this;
  },
  unobserve : function(subject, key, viewModel) {
    var obs = this[this.constructor.dontEnum+'obs'],
        observers, observer, i, l;
    
    viewModel || (viewModel = this);
    
    if (obs.hasOwnProperty(subject) && _.isArray(observers = obs[subject]) &&
        (i = observers.length)
    ){
        if (!key) delete obs[subject];
        else while (i--) {
          observer = observers[i];
          observer.key == key && 
            observer.viewModel == viewModel && 
            observers.splice(i, 1);
        }
    }
    return this;
  },
  // Refresh observers.
  report : function(subjects) {
    
    var obs = this[this.constructor.dontEnum+'obs'],
        observers, observer, viewModel, key, val, i, l;
    
    // Force subjects into an array.
    subjects = [].concat(subjects);
    
    // Refresh matched dependent attributes
    _.each(obs, function(observers, subject) {
      subject = subject.split(' ');
      for (i = 0, l = subject.length; i < l; i++) {
        if (~subjects.indexOf(subject[i])) break;
        else if (i == l-1) return;
      }
      for (i = 0, l = observers.length; i < l; i++) {
        observer  = observers[i];
        key       = observer.key;
        viewModel = observer.viewModel;
        viewModel.constructor.refresh(viewModel, key);
      }
    });
    return this;
  },

  // Remove instance.
  remove : function() {
    
    var viewData = this, 
        static   = viewData.constructor,
        parent   = viewData[static.dontEnum+'parent'];
        
    if (!parent)
      throw new Error('Cannot remove an orphan ViewModel instance.')
    
    static.invoke(viewData, function(){        
      _.each(parent, function(val, key) {
        if (val == viewData) {
          isViewModelArray(parent) ?
            parent.splice(key, 1) :
            delete parent[key];
          parent._view.render(); // Avoid rendering the whole collection again?
        }
      });
      return false;
    });
  }
  
}, new function(){
  
  // Request methods.
  mixin(this, requestFns, function(fn, args) {
    var static   = this.constructor,
        data     = static.strip(this),
        url      = static.getUrl(this),
        settings = args[0] || {};
    settings.data || (settings.data = data);
    settings.url  || (settings.url  = url);
    return static.sync(fn, settings);
  });

});