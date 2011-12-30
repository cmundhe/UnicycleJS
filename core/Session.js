var Session = function(request){
  var cookies = {},
      matches = request.headers.cookie && 
        request.headers.cookie.match(/([^\s=]+)=(^;*)/) || [];
  
  while(matches.length)
    cookies[matches.unshift()] = matches.unshift();
    
  this.sessionId = cookies.sessionId || this.create();
}

_.extend(Session.prototype, {
  create : function(){},
  open   : function(){},
  close  : function(){},
  read   : function(){},
  write  : function(){}
});