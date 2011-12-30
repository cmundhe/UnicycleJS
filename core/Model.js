(function(undefined){
  
  /**
   * Base model.
   */
  this.Model = this.Object.extend({
    
    // Constructor.
    // ---------------------------------
    constructor : function(method, route, query, data) {
      var action  = route(pathname),
          options = this[action](pathname, query, data);
      return this.db[method](options, data);
    },
    
    // Properties.
    // ---------------------------------
    db        : this.MySQL,
    table     : '',
    relations : {
      hasMany    : [],
      belongsTo  : [],
      manyToMany : []
    },
    options   : {
      fields  : '*',
      from    : [],
      join    : false,
      where   : [],
      groupBy : [],
      having  : [],
      orderBy : 'id ASC',
      limit   : false
    },
    
    // Methods.
    // ---------------------------------
    merge : function(previous, current) {
      if (current == null) 
        return previous;
      var curVal;
      _.each(previous, function(prevVal, key) {
        curVal = current[key];
        current[key] = prevVal != null ?
          isObject(curVal) ?
            this.merge(prevVal, curVal) :
            _.isArray(curVal) ?
              curVal.concat(prevVal) :
              prevVal :
          curVal || prevVal;
      }, this);
      return current;
    }
    
  });
  
  //this.Tree = this.Model.extend({});
  
  this.Section = this.Tree.extend({
    
    table : 'sections',
    
    relations : {
      hasMany   : Articles,
      belongsTo : Roles
    },
    
    options : {
      where   : ['roles.rank > ' + Unicycle.session.rolesRank],
      orderBy : 'id ASC'
    },
    
    rewrites : {
      'default'           : '/news/',
      '/:title/articles/' : '/:title/'  
    },
    
    '/:title/' : function(params, data) {
      return {
        from    : [Articles],
        where   : 'title = ' + params.title,
        orderBy : 'created DSC'  
      }
    }
    
  });
  
}).call(Unicycle);
