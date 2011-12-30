(function(undefined) {

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

}).call(Core);