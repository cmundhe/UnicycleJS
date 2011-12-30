/*(function(undefined) {
  
  // Unicycle.ViewDataType
  // ---------------------
  this.ViewDataType = this.Object.extend(
  
  {
    // Constructor
    // -----------
    constructor : function(data, options) {
      data != null || (data    = this.data);
      options      || (options = {});
      
      // Compute default data function in context of parent
      while (_.isFunction(data))
        data = data.call(options.parent);
      
      // If data is a number, create an array of that length
      ~~data === data && (data = Array(data));
      
      // Extend default options
      options = extend({}, this.options, options);
      
      return data ?
        _.isArray(data) ?
          new this.ViewModelArray(this.ViewModel, data, options) :
          new this.ViewModel(data, options) :
        undefined;
    },
    
    // Properties
    // ----------
    data           : {},
    options        : {},
    ViewModel      : Core.ViewModel,
    ViewModelArray : Core.ViewModelArray,
    
  },{
    
    create : function(ViewModel, data, options) {
      return this.extend({
        data      : data != null ? data : undefined,
        options   : options   || undefined,
        ViewModel : ViewModel || undefined
      });
    }
    
  });
  
}).call(Core);*/