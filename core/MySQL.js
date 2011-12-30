/**
 * MySQL database adapter.
 */
this.MySQL = {
      
  handle  : require('mysql'),
  client  : null,
  
  connect : function(){
    this.client = this.handle.createClient(
      CONFIG.host,
      CONFIG.username,
      CONFIG.password, 
      CONFIG.database, 
    );
  },
  
  query : function(query) {
    return this.client.query(query);
  },
  
  // CRUD methods.
  // ---------------------------------
  select : function(options) {
    options || (options = {});
    var fields = options.fields ?
          [].concat(options.fields).join(', ') :
          '*',
        tables = options.tables ?
          [].concat(options.tables).join(', ') :
          '',
        where   = options.where,
        groupBy = options.groupBy,
        having  = options.having,
        orderBy = options.orderBy,
        limit   = options.limit;
        
    return this.query(
      'SELECT %s FROM %s WHERE %s GROUP BY %s HAVING %s ORDER BY %s LIMIT %s;',
      fields, tables, where, groupBy, having, orderBy, limit
    );
  },
  insert  : function(options){},
  update  : function(options){},
  del     : function(options){}
  
};