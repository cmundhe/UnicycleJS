(function(undefined) {

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
  
}).call(Core);