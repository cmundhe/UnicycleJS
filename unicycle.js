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

});(function(undefined) {

// Unicycle.core.Object
// -----------------------------------

  this.Object = function(){};

  // Inheritance
  this.Object.extend = function(protoProps, staticProps) {
    protoProps || (protoProps = {});
    var parent = this, child;
    if (protoProps.hasOwnProperty('constructor')) {
      child = protoProps.constructor;
    } else {
      child = function() { return parent.apply(this, arguments) };
    }
    child.prototype = create(parent.prototype, protoProps);
    child.prototype.constructor = child;
    return extend(child, parent, staticProps || {}, {__super__ : parent });
  };
  
  // Ensure invisible prototypal footprint [Cross-browser?]
  this.Object.prototype = undefined;
  
  
  // Unicycle.core.History
  // -----------------------------------
  this.History = this.Object.extend({
  
    // Constructor
    // ---------------------------------
    constructor : function() { 
      
      this.href          = location.href;
      this.baseUrl       = location.hostname + this.basePath;
      this.baseUrlRegExp = RegExp("^"+this.baseUrl);
      
      var self = this;
      
      $(window).delegate('a', 'click', function(event){
        self.navigate(event.target);
      });
      
      if (this.usePushState) {
        //window.onpopstate = _.bind(function(){ this.loadUrl(location.href) }, this)
      } else {
        /*setInterval(function(){
        self.href !== location.href && self.loadUrl(location.href)
        }, this.pollHashInterval);*/
      }
      
      return this;
    },
    
    // Properties
    // ---------------------------------
    href             : null,
    basePath         : null,
    baseUrl          : null,
    baseUrlRegExp    : null,
    pollHashInterval : null,
    usePushState     : null,
    
    // Methods
    // ---------------------------------
    navigate : function(anchor) {
      if (this.rootRegExp.test(anchor.hostname + anchor.pathname)) {
        if (this.href != anchor.href) {
          settings.usePushState ?
          history.pushState({}, '', anchor.href) :
          //location.hash = anchor.href.match(/ /)[1]; ??
          this.loadUrl(anchor);
        }
        event.preventDefault();
        return false;
      }
      return true;
    },
    loadUrl : function(anchor) {
      this.href = anchor.href;
      // Split url args into an array for convenience. Account for hash and query string?
      var args = anchor.pathname.replace(/^\/|\/$/g, "").split("/");
      $(window).trigger('urlChange', href, args);
    }
  });
  
  
  // Unicycle.core.Storage
  // -----------------------------------
  this.Storage = this.Object.extend({
    
    constructor : function() {
      
      if (this.cache) {
        
        if (_.isFunction(Storage) && localStorage instanceof Storage) {
          var fns = _.filter(Storage.prototype, function(val, key){
            return _.isFunction(val);
          });
          mixin(this, localStorageFns, function(fn, args){
            return localStorage[fn].apply(localStorage, args);
          });
        } else if (document.body.style.behavior) {
          //var storage = document.createElement('div');
          //storage.id  = 'userData';
          //storage.style.behavior = 'url("#default#userData")';
          //storage.style.display  = 'none'; Necessary?
          //document.body.appendChild(storage); Necessary?
        }
         
      } else this.clear();
      
      return this;
    },
    
    // Properties
    // ---------------------------------
    cache           : null,
    hasLocalStorage : null,
    
    // Methods
    // ---------------------------------
    getObject : function(key){
      return JSON.parse(this.getItem(key))
    },
    setObject : function(key, value){
      !_.isString(key) && _.each(key, function(key, value){
        return this.setObject(key, value);
      }, this);
      return this.setItem(key, JSON.stringify(value));
    },
    
    // User data behavior methods (<= IE7)
    getItem : function(){},
    setItem : function(){},
    remove  : function(){},
    clear   : function(){},
    key     : function(){}
  });
  
}).call(Core);(function(undefined) {

/**
 * Unicycle.core.ViewModel.
 * -----------------------------------------------------------------------------
 * Augments data models with properties to be rendered in corresponding View(s).
 */
   
  this.ViewModel = this.Object.extend(
  
  {
    // Constructor.
    // -----------------------
    constructor : function(data, options) {
      
      var static   = this.constructor;
    
      data != null || (data    = static.data);
      options      || (options = {});
      
      // Compute default data function in context of parent.
      while (_.isFunction(data)) {
        data = data.call(options.parent || {});
      }
      
      // If data is a number, create an array of that length.
      ~~data === data && (data = Array(data));
        
      // Extend default options.
      options = extend({}, static.options, options);
      
      if (data === false)
        return undefined;
      else if (_.isArray(data)) {
        return new Unicycle.core.ViewModelArray(static, data, options);
      }
      
      // Extend model with default attributes.
      data = extend({}, this, data);
      
      // Set options.
      if (options.root)
        Unicycle.core.ViewModel.prototype[static.dontEnum+'app'] = this;
      if (options.parent)
        this[static.dontEnum+'parent'] = options.parent;
      
      // Set model.
      static.set(this, data);
      return this;
    },
    
    // Prototype properties.
    // -----------------------
    url : '', // Often will be a function.
    
  },
  
  extend({}, ViewDataStatic, {
    
    // Static properties.
    // -----------------------
    data    : {},
    options : {},
    View    : null,
    
    
    // Static methods.
    // -----------------------
    // Refresh specified dependent attributes.
    refresh : function(viewModel, dependents) { 
      
      dependents = [].concat(dependents);
      
      var static    = this,
          prototype = static.prototype,
          options   = {parent : viewModel},
          i = dependents.length, val;
          
      while(i--) {
        key = dependents[i];
        val = prototype[key];
        if (static.isEnum(key) && _.isFunction(val)) {
          viewModel[key] = isViewModel(val.prototype) ?
            new val(null, options) :
            val.call(viewModel);
        }
      }
      return viewModel;
    },
    // Set attributes on a ViewModel instance.
    set : function(viewModel, model) {
      
      var static     = viewModel.constructor,
          prototype  = static.prototype,
          dependents = [],
          options    = { parent : viewModel },
          protoVal, ViewModel;
      
      _.each(model, function(modelVal, key) {
        
        // Allow null (Note: JSON parses NaN as null).
        if (modelVal !== undefined && static.isEnum(key)) {
          
          protoVal = prototype[key];
          
          // Compute non-dependent function-valued attributes.
          while (_.isFunction(modelVal) && modelVal !== protoVal) {
            modelVal = modelVal();
          }
          
          // Array or object case (not ViewModel or ViewModelArray instance).
          if (isCollection(modelVal) && !isViewData(modelVal)) {
            ViewModel = _.isFunction(protoVal) && isViewModel(protoVal.prototype) ? 
              protoVal : Unicycle.core.ViewModel.extend();
            return viewModel[key] = new ViewModel(modelVal, options);
          }
          
          // Dependent attribute case.
          // Chrome does not preserve insertion order for object with numbered
          // properties.
          if (_.isFunction(modelVal)) {
            if (~~key === key) {
              throw Error('Function-valued ViewModel attributes cannot have \
                numbered references.');
            }
            return dependents.push(key);
          }
          
          // ViewModel/ViewModelArray instance, string, number, boolean, date,
          // and null case.
          viewModel[key] = modelVal;
        }
      });
      
      // Set dependent attribute values.
      static.refresh(viewModel, dependents);
      return viewModel;
    },
    // Update attributes on a ViewModel instance.
    update : function(viewModel, model) {
      
      // First set all non-collection-valued attributes. Necessary to ensure
      // that dependent attributes are computed at the proper time.
      var static      = viewModel.constructor,
          prototype   = static.prototype,
          keyOrder    = _.keys(prototype),
          changedKeys = [],
          newModel    = {},
          key, oldVal, protoVal, modelVal, i = 0, l;
          
      while (i++ < 2) {
        for (key in arguments[i]) {
          if (model.hasOwnProperty(key) && 
              (i == viewModel.hasOwnProperty(key)) && 
              static.isEnum(key)
          ){
            modelVal = model[key];
            
            // Compute function-valued passed attributes
            while (_.isFunction(modelVal)) modelVal = modelVal();
            
            isCollection(modelVal) && 
            !isViewData(modelVal) ?
              changedKeys.push(key) : 
              newModel[key] = modelVal;
          }
        }  
      }
      
      // Set all non-collection-valued attributes.
      static.set(viewModel, newModel, options);
      
      // Order keys.
      l = keyOrder.length + updateKeys.length;
      changedKeys = _.sortBy(updateKeys, function(index, key){
        return ~(index = keyOrder.indexOf(key)) ?
          index : l++;
      });
      
      for (i = 0, l = changedKeys.length; i < l; i++) {
        key      = changedKeys[i];
        oldVal   = viewModel[key]; 
        protoVal = prototype[key];
        modelVal = model[key];
        
        _.isFunction(protoVal) && isViewModel(protoVal.prototype) &&
        isViewData(oldVal) && (oldVal instanceof protoVal) ?
          viewModel[key] = oldVal.constructor.update(oldVal, modelVal) :
          static.set(viewModel, new function(){ this[key] = modelVal });
      }
      
      return viewModel;
    }
    
  }));

}).call(Core);(function(undefined) {
            
// Unicycle.ViewModelArray
// -----------------------
  // Collection of ViewModels of the same type. Extends window.Array.
  // Will return '[object Object]' on .toString() and false on _.isArray(),
  // but true on instanceof window.Array.
  this.ViewModelArray = this.Object.extend.call(Array,
    
    // Prototype
    // ------------
    extend({
      
      // Constructor
      // -----------
      constructor : function(ViewModel, models, options) {  
        
        // Set options.
        options || (options = {});
        if (options.parent)
          this[this.constructor.dontEnum+'parent'] = options.parent;
        if (options.url)
          this.url = url;
        
        // Set properties.
        this.ViewModel = ViewModel;
        this.options   = {parent : this};
        this.push.apply(this, models);
        
        return this;
      },
      
      // Properties
      // ----------
      options      : null,
      ViewModel    : null,
      url          : '',
      
      // Methods
      // ---------
      // Convenience mutation methods.
      add : function(model, index) {
        this.splice((~~index === index ? index : this.length), 0, model);
        return this;
      },
      remove : function(index) {
        ~~index === index && this.splice(index, 1);
        return this;
      },
      // Necessary for toString not to throw error.
      toString : function(){
        return this.slice().toString();
      }
    }, new function(){
      
      // Override Array.prototype methods that can add elements.
      mixin(this, arrayAddFns, function(fn, args) {
        var i = +(fn == 'splice') && 2, l = args.length;
        for (; i < l; i++) args[i] = new this.ViewModel(args[i], this.options);
        return arrayProto[fn].apply(this, args);
      });
      
      // Mixin Underscore collection methods.
      mixin(this, underscoreFns, function(fn, args) {
        return _[fn].apply(_, [this].concat(args));
      });
      
    }),
    
    // Static
    // ----------
    extend({}, this.Object, ViewDataStatic)
  );
    
}).call(Core);(function(undefined) {

// Unicycle.View
// -----------------------------------------------------------------------------
// Renders ViewModel data in templates and delegates events
// Returns DOM nodes rather than an HTML string. For event delegation
// to work without user-defined selectors, parent rendering scope has to maintain
// references to DOM nodes created in child scopes.

  this.View = this.Object.extend(
  
  // Prototype
  // ---------------------------------------------------------------------------
  {
    // Constructor
    // -------------------------------------------------------------------------
    constructor : function(data) {
      
      this.ViewModel  = isViewModelArray(data) ?
        data.ViewModel : 
        data.constructor;
      
      this.data       = data;
      this.events     = this.ViewModel.events || {};
      this.context    = false;
      this.nodes      = [];
      this.childViews = [];
      this.cid        = _.uniqueId('view');
      
      data._view  = this;
      
      this.refresh();
      
      if (_.isFunction(this.events.initialize))
        this.ViewModel.invoke(data, this.events.initialize);
        
      return this;
    },

    // Properties
    // -------------------------------------------------------------------------
    browserEvents : [],
    eventSplitter : null,
    
    // Methods
    // -------------------------------------------------------------------------
    /*collapse : function (index, childViews, arrChildViews) {
    
      arrChildViews || (arrChildViews = []);    
      var i = 0, j = 0, childView, arrChildView;
      
      while (childView = childViews[i++]) {
      
        // Result will either match an existing result or be undefined
        while (arrChildView = arrChildViews[j++] && 
          childView.data.constructor != arrChildView.data.constructor);
        
        // If undefined, create a new result
        if (!arrChildView) {
          
          arrChildView = {
            data       : [],
            nodes      : [],
            childViews : [],
            context    : false
          };
          
          arrChildViews.push(arrChildView);
        }
        
        arrChildView.data[index]  = childView.data,
        arrChildView.nodes[index] = childView.nodes,
        arrChildView.childViews   = this.collapse(index, childView.childViews, []);
      }
      
      return arrChildViews;
    },*/

    refresh : function() {
      
      var data = this.data,
          i    = 0, 
          j, childViews, nodes;
      
      if (isViewModelArray(data)) {
        
        childViews = [];
        nodes      = [];
        
        var View = data.ViewModel.View, 
            childView;
    
        for (j = data.length; i < j; i++) {
          childView  = new View(data[i]);
          //childViews = this.collapse(i, childView.childViews, childViews);
          nodes[i]   = childView.nodes;
        }
      
      } else {
        
        // Create a dummy div.
        // Not a documentFragment b/c it lacks innerHTML property.
        var el        = document.createElement('div'),
            innerHTML = '',
            placeholders;
            
        childViews = this.template(data);
        
        // Set innerHTML of dummy div, using placeholders for HTMLElements.
        // Leverage innerHTML's speed of DOM element creation.
        while ((j = childViews[i]) != null) {
          if (isPrimitive(j) || _.isArray(j)) {
            innerHTML += childViews.splice(i, 1);
          } else {
            if (isViewModel(j)) {
              childViews[i++] = new j.constructor.View(j);
              innerHTML += '<div class="__p"></div>';
            } else if (isViewModelArray(j)) {
              childViews[i++] = new j.ViewModel.View(j);
              innerHTML += '<div class="__p"></div>';
            }
          }
        }
        el.innerHTML = innerHTML;
        
        // Select placeholders. Possible conflict with class '__p'.
        placeholders = el.getElementsByClassName('__p');
        
        // Determine if placeholders have unique contexts and replace.
        // If no context, there will be a performance hit during event handling.
        // Backwards iteration b/c placeholder array is a live collection.
        while(i--) {
        
          j = placeholders[i];
          
          // Set context only if placeholder has a parent (that is not el) and no element siblings.
          childViews[i].context = 
              j.parentNode != el && 
              !j.nextElementSibling && 
              !j.previousElementSibling && 
              j.parentNode;
          
          // Try to eliminate jQuery call.
          $(j).replaceWith(_.flatten(childViews[i].nodes));
        }
        
        nodes = slice(el.childNodes);
      }
      
      // Remove old nodes and add new nodes.
      while (this.nodes.pop());
      this.nodes.push.apply(this.nodes, nodes);
      this.childViews = childViews;
      
      return this;
    },
    render : function(dontRefresh) {
      
      var docFrag    = document.createDocumentFragment(),
          oldNodes   = _.flatten(this.nodes),
          parent     = oldNodes[0] && oldNodes[0].parentNode,
          context    = this.context || parent;
      
      dontRefresh || this.refresh();

      var nodes      = _.flatten(this.nodes),
          childViews = this.childViews;
          i = 0, l = nodes.length;
      
      // Build document fragment    
      while (i < l)
        docFrag.appendChild(nodes[i++]);
      
      if (!dontRefresh && oldNodes) {
      
        // Remove all old nodes and replace with document fragment.
        while (oldNodes.length > 1)
          parent.removeChild(oldNodes.pop());
        parent.replaceChild(docFrag, oldNodes[0]);
        
        // Re-delegate childViews.
        for (i = 0, l = childViews.length; i < l; i++)
          childViews[i].delegateEvents(context);
          
      } else {
        context.appendChild(docFrag);
        this.delegateEvents(context);
      }
      
      return this;
      
    },
    delegateEvents : function(context) {
      
      var view          = this,
          ViewModel     = view.ViewModel,
          data          = view.data,
          events        = view.events,
          context       = view.context || context,
          nodes         = view.nodes,
          childViews    = view.childViews,
          cid           = view.cid,
          browserEvents = view.browserEvents,
          splitter      = view.eventSplitter;
          
      _.each(events, function(handler, eventString) {
        
        var matches       = eventString.match(splitter),
            namespace     = (matches[2] || '') + '.' + cid,
            event         = matches[1] + namespace,
            selector      = matches[3]  || '',
            browserEvent  = !!~browserEvents.indexOf(event),
            eventContext  = browserEvent ? window : context,
            target, targetData, dataIndex, i;
        
        $(eventContext).delegate(selector, event, function(event) {
          
          target     = event.target;
          targetData = data;
          
          if (!browserEvent && (!view.context || isViewModelArray(data))) {
            if ((dataIndex = view.indexOfData(nodes, context, target)) === false)
              return view;
            else if (_.isArray(dataIndex)) {
              while ((i = dataIndex.pop()) != null) targetData = targetData[i];
            }
          }
          
          // Prepend passed arguments to default arguments.
          var args = slice(arguments, 1);
          args.push(target, context, event);
          
          // Invoke handler.
          ViewModel.invoke(targetData, function(){
            return handler.apply(targetData, args)
          });
          
          return view;
          
        });
        
      });
      
      for (var i = 0, l = childViews.length; i < l; i++)
        childViews[i].delegateEvents(context);
        
      return this;
    },
    indexOfData : function (nodes, context, target, dataIndex) {
      
      var index = nodes.length;
      
      if (_.isArray(nodes[index-1])) {
        while(index--) {
          if (this.indexOfData(nodes[index], context, target, index)) {
            return dataIndex ? 
              [index].concat(dataIndex) :
              [index];
          }
        }
      } else if (index) {
        while (target != context) {
          if (~nodes.indexOf(target))
            return true;
          target = target.parentNode;
        }
      }
      return false;
    }
  },
  
  // Static
  // -----------------------------------
  {
    // Template engine compile method. Configure in Unicycle.setup().
    compile : null,
    // Create a new subclass with a compiled template function.
    create   : function(str) {
      return this.extend({
        template : this.compile(str+'<% return __p; %>')
      });
    }
  });

}).call(Core);var Unicycle;

(function(undefined){

  // Clean reference to app events.
  var AppEvents = {
    urlChange : function(url) {
      var static = this.constructor,
          model  = static.storage.getObject(url) || this._fetch({url : url});
      static.storage.setObject(url, model);
      static.update(model);
    },
    
    redirect : function(url, force) {
      force ?
        location.href = url :
        this.constructor.history.navigate(url);
    }
  },
  	
  // Clean reference to app prototype.
  AppProto = { url : '/' },
  
  // Convenience references.
  appKey, eventRegExp;
  
  Unicycle = {
    
    // Core objects
    // -------------------------------------------------------------------------
    core : Core,
    
    // Options
    // -------------------------------------------------------------------------
    options : {
    	
    	// Names.
    	event    : '$',
    	dontEnum : '_',
    	
    	// AJAX.
    	basePath         : '',                               // Base URL path.
    	pollHashInterval : 200,                              // Frequency of hash polling.
    	usePushState     : !!history.pushState,              // Use HTML5 history API.
    	syncOnStart      : false,                            // Perform GET request for location.href on Unicycle.start().
    	
    	// Templating.
    	templateContext     : 'body',                        // jQuery selector.
    	templateCompile     : _.bind(_.template, _),         // Compile function.
    	templateEvaluate    : undefined,                     // Defaults to Underscore template evaluate.
      templateInterpolate : /\{\{(.*?)\}\}/g,              // Matches {{expression}}.
    	templateSplitter    : /\{\{#[\s]*([\S]+?)[\s]*\}\}/, // Matches {{#attribute}}.
      
      // Events.
      browserEvents : ['urlChange', 'redirect'],
      eventSplitter : /^[\s]*([\w]+)(\.?\S*) ?([\S]*)/,    // Regex for parsing event strings.
    	
    	// Miscellaneous.
    	cache        : true,                                 // Enable local storage of application data.
    	startOnReady : false                                 // Invoke Unicycle.start() on document ready.
    	
    },
    
    // User-defined types
    // -------------------------------------------------------------------------
    ViewModels : {},
    Views      : {},
    
    // State
    // -------------------------------------------------------------------------
    history     : null,
    storage     : null,
    view        : null,
    viewModel   : null,
    
    // API methods
    // -------------------------------------------------------------------------
    setup : function(options) {
      options || (options = {});
      extend(this.options, options.options);
      this._prepare();
      this._defineViewModels(options.app);
      this._defineTemplates(options.template);
      return this;
    },
    start : function() {
      this.history   || (this.history = new this.core.History());
      this.storage   || (this.storage = new this.core.Storage());
      this.viewModel || this.update();

      // Sync once with current url before proceeding.
      this.options.syncOnStart && $(window).trigger('urlChange');

      // Render app.
      this.view.context = $(this.options.templateContext)[0];
      this.view.render(true);
      
      return this;
    },
    update : function(model, options) {
      model   || (model   = {});
      options || (options = {});
      
      if (!_.isObject(model)) {
        throw new TypeError('Argument model in Unicycle.update() must be an object.');
      } else if (!this.viewModel) {
        this._prepare();
        this.viewModel = new this.ViewModels[appKey](model, options);
        this.view      = new this.Views[appKey](this.viewModel);
      } else {
        this.viewModel = this.viewModel.constructor.update(this.viewModel, model);
        this.view      = this.viewModel._view;
      }
      return this;
    },
    
    // Internal methods
    // -------------------------------------------------------------------------
    _prepare : _.once(function(){
      var options  = this.options,
          core     = this.core,
          dontEnum = options.dontEnum;
      
      // Set global variables.
      appKey      = dontEnum + 'app';
      eventRegExp = RegExp('^'+escRegExp(options.event)+'(.*)$');

      // History.
      extend(core.History.prototype, {
        basePath         : options.basePath,
        pollHashInterval : options.pollHashInterval,
        usePushState     : options.usePushState
      });
      
      // Storage.
      extend(core.Storage.prototype, {
        cache : options.cache
      });
      
      // ViewModel / ViewModelArray.
      _.each(ViewDataProto, function(val, key) {
        core.ViewModel.prototype[dontEnum+key]      = val;
        core.ViewModelArray.prototype[dontEnum+key] = val;
      });
      core.ViewModel.dontEnum      = dontEnum;
      core.ViewModelArray.dontEnum = dontEnum;
      
      // View.
      extend(core.View, {
        compile : options.templateCompile
      });
      extend(core.View.prototype, {
        browserEvents : options.browserEvents,
        eventSplitter : options.eventSplitter
      });
      
      // Underscore templating.
      extend(_.templateSettings, {
        evaluate    : options.templateEvaluate,
        interpolate : options.templateInterpolate
      });
      
      if (options.startOnReady) {
        $(_.bind(function(){ this.start() }, this));
      }
      
      return this;
    }),
    _defineViewModels : function(obj, name) {
      
      var _obj = _.isArray(obj) ? obj[0] : obj,
          childName;
      
      name || (name = appKey);
      
      if (isObject(_obj) && !isViewData(_obj)) {
        var events = {}, match;
        _.each(_obj, function(val, key) {
          if (match = key.match(eventRegExp)) {
            events[match[1]] = val;
            delete _obj[key];
          }
        }, this);
        _obj = (name == appKey) ?
          Unicycle.core.ViewModel.extend(
            extend({}, AppProto, _obj),
            {
              data    : obj[1],
              events  : extend({}, AppEvents, events),
              options : extend({}, {root : true}, obj[2])
            }
          ) :
          Unicycle.core.ViewModel.extend(_obj, {
            data    : obj[1],
            events  : events,
            options : obj[2]
          });
      }
      
      obj = _obj;
      
      if (isViewModel(obj.prototype)) {
        _.each(obj.prototype, function(val, key) {
          if (key != 'constructor' && Unicycle.core.ViewModel.isEnum(key)) {
            childName = (name == appKey) ? key : name+'.'+key;
            obj.prototype[key] = this._defineViewModels(val, childName);
          }
        }, this);
        
        this.ViewModels[name] = obj;
        this._bindViews(name);
      }
      return obj;
    },
    // Compile template file(s) into unique Unicycle.View objects.
    // Accepts string/array of either urls or script tag ids or both.
    _defineTemplates : function(sources) {
      var source, i;
      sources = [].concat(sources);      
      while (source = sources.shift()) {
        source.match(/^#[\w]*$/) && (i = $(source), i.length) ?
            this._splitTemplate(i.html()) :
            $.ajax({url: source, async: false, success: this._splitTemplate});
      }
      _.each(this.ViewModels, function(ViewModel, name) {
        this._bindViews(name);
      }, this);
      return this;
    },
    // Split template into partials
    _splitTemplate : function(source) {
      // String.prototype.split() with capture groups not cross-browser???
      var templates = source.match(/^\s*([\s\S]*)$/)[1]
        .split(this.options.templateSplitter),
          key, index, i;
      templates[0].match(/^[\s\n\t]*$/) && templates.shift();
      for (i = templates.length; i--; i && i--) {
        key = templates[i-1] || appKey;
        // Create a View subclass with template.
        this.Views[key] = this.core.View.create(templates[i]);
      }
    },
    // Bind Views to their corresponding ViewModels.
    _bindViews : function(ViewModelName, ViewName) {
      ViewName || (ViewName = ViewModelName);
      return this.Views[ViewName] ?
        this.ViewModels[ViewModelName].View = this.Views[ViewName] :
        (ViewName = ViewName.match(/\.(\w+)$/)) ?
          this._bindViews(ViewModelName, ViewName[1]) : false;
    }
    
  };
  
})();