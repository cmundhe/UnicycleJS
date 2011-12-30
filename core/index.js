// Data comes from :
// -----------------
// 1. URL pathname (including named route parameters)
// 2. URL query string [GET] -or- JSON object [POST/PUT/DELETE]
// 3. Session
  
// Private vars.
// ---------------------------------------------------------------------------
var methodMap = {
  'GET'    : 'select',
  'POST'   : 'insert',
  'PUT'    : 'update',
  'DELETE' : 'del'
},
urlRegExp = /^\/?([^\/]*)([^\?]*)\??(.*)$/;

// Modules.
// ---------------------------------------------------------------------------
var http   = require('http');
    url    = require('url');
    core   = require('./core');
    models = require('./models');

// Properties
// ---------------------------------------------------------------------------
var defaultModel = 'section';

// Methods
// ---------------------------------------------------------------------------
dispatch = function(request){  
  var method = methodMap[request.method],
      data   = request.data,
      [model, route, query] = this.parse(request.url); 
  this.Models[model](method, route, query, data);
};

parse = function(url) {
  url = url.match(urlRegExp);
  var model    = url[0] || this.defaultModel;
      route    = url[1] || '',
      search   = url[2] ? url[2].split('&') : '',
      query    = {};
  for (var i = 0, l = search.length, s, key, val; i < l; i++) {
    if (s = search[i]) {
      [key, val] = s.split('=');
      query[key] = val;
    }
  }  
  return [model, route, query];
}

_.bindAll(this);

// Create server.
// ---------------------------------------------------------------------------
this.http.createServer(function(request, response) {
  response.end(this.dispatch(request));
});
  
}).call(Unicycle);