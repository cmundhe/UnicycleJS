(function(undefined) {
            
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
    
}).call(Core);