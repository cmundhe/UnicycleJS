var Unicycle;

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