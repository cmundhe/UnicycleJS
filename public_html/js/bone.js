var Bone = {};

(function(undefined) {
	
  _.templateSettings.interpolate = /\{\{(.+?)\}\}/g;
  
  var eventSplitter = /^(\S+)\s*(.*)$/,
      isObject = function(obj) {
        return obj.toString() == '[object Object]';
      };
      isModel = function(obj) {
        return obj instanceof Backbone.Model || obj instanceof Backbone.Collection;
      };
	
  this.Model = Backbone.Model.extend({
    //
    // Constructor
    constructor : function(attributes, options) {
      /*this.bind('change', this.setDependents, this);*/
      if (this.view.prototype instanceof Backbone.View) {
        this.view = new this.view({model : this});
      } else {
        _.each(this.view, function(view, key) {
          this.view[key] = new view({model : this});
        }, this);
      }
      Backbone.Model.call(this, attributes, options);
      /*this.setDependents();
      this._changed = false;*/
    },
    //
    // Properties
    view : {},
    //
    // Methods
    set : function(attrs, options) {
      options || (options = {});
      if (!attrs) return this;
      if (attrs.attributes) attrs = attrs.attributes;
      var now = this.attributes, escaped = this._escapedAttributes;
      if (!options.silent && this.validate && !this._performValidation(attrs, options)) return false;
      //if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];
      var alreadyChanging = this._changing;
      this._changing = true;
      
      var childOptions = {};
      this instanceof Backbone.Collection && (childOptions.collection = this);
      
      for (var attr in attrs) {
      
        var val = attrs[attr];
      
        if (!_.isEqual(now[attr], val)) {
      
          var isCollection = _.isArray(val) && 
              (_.isObject(_.flatten(val)[0]) || isModel(_.flatten(val)[0])) ?
              true : false;
          
          if (isObject(val) || isCollection) {
            var _default = this.defaults && this.defaults[attr];
            now[attr] = _default && isModel(_default.prototype) ? 
                new _default(val, childOptions) :
                isObject(val) ?
                    new Bone.Model(val, childOptions) :
                    new Bone.Collection(val, childOptions);
          } else if (_.isFunction(val) && isModel(val.prototype)) {
            now[attr] = new val({}, childOptions);
          } else {
            now[attr] = val;
          }
      
          delete escaped[attr];
          this._changed = true;
          if (!options.silent) {
            this.trigger('change:' + attr, this, val, options);
          }
        }
      }
      if (!alreadyChanging && !options.silent && this._changed) {
        this.change(options);
      }
      this._changing = false;
      return this;
    },
		/*setDependents : (function(){
			var F = function(model){
				_.each(model.dependents, function(dependent, key) {
					this[key] = dependent.call(model);
				}, this);
			};
			return function() {
				var attrs = new F(this);
				_.isEmpty(attrs) || this.set(attrs, {silent : true});
			}
		})(),*/
    template : function(viewKey) {
      var view = this.view instanceof Backbone.View ? 
          this.view : this.view[viewKey] || null;
      if (view) {
        Bone.View.registerView(view);
        var el = document.createElement('div');
        el.innerHTML = view.template();
        $(el.children[0]).attr('data-model', this.cid);
        return el.innerHTML;
      }
      return '';
    }
  });
	
	this.Collection = Backbone.Collection.extend({
		initialize : function(attributes, options) {},
		template   : function(viewKey) {
			var markup = '', i = 0, model;
			while (model = this.models[i++]) markup += model.template(viewKey);
			return markup;
		}
	});
	
	this.View = Backbone.View.extend({
		// 
		// Constructor
		constructor : function(options) {
			if(!this.cid) {
				this.cid = _.uniqueId('view');
				this._configure(options || {});
				//
				// Bone additions
				this.bind('render', this.constructor.updateViews, this.constructor);
				this.model.bind('change', this.render, this);
				_.isString(this.template) && (this.template = this.compile(this.template));
			}
			//this._ensureElement();
			this.delegateEvents();
			this.initialize.apply(this, arguments);
		},
		//
    // Properties
    events : {},
    template : null,
    //
    // Methods
    compile : function(selector) {
      var compiled = _.template($(selector).html());
      return function(){
        return compiled(this.model.toJSON());
      }
    },
    delegateEvents : function(events) {
      if (!$(this.el).length || !events && _.isEmpty(events = this.events)) return;
      $(this.el).unbind('.delegateEvents' + this.cid);
      
      for (var key in events) {
        var val    = events[key],
            method = _.isFunction(val) ? val : this[val];
        
        if (method) {
          
          var handler   = _.bind(function(event) { method.call(this, event) }, this);
              match     = key.match(eventSplitter),
              eventName = match[1] + '.delegateEvents' + this.cid,
              selector  = match[2] || '';
                //($(this.el)[0].children.length ? ' ' : '');
                
          selector ?
              $(this.el).delegate(selector, eventName, handler) :
              $(this.el).bind(eventName, handler);
        }
        
      }
    },
    _ensureElement : function() {
      if (!this.el) {
        var attrs = this.attributes || {};
        if (this.id) attrs.id = this.id;
        if (this.className) attrs['class'] = this.className;
        this.el = this.make(this.tagName, attrs);
      } /*else if (_.isString(this.el)) {
      this.el = $(this.el).get(0);
      }*/
    },
    render : function() {
      $(this.el).length ? 
        $(this.el).replaceWith(this.model.template()) :
        document.body.innerHTML = this.model.template();
			this.trigger('render');
			return this;
		}
	},{
    // Static properties
    //
    views : [],
    // Static methods 
    registerView : function(view) {
      this.views.push(view)
    },
    updateViews : function() {
      var view;
      while (view = this.views.pop()) {
        view.el = view.constructor.prototype.el;
        var collection = view.model.collection;
        if (_.isString(view.el) && collection instanceof Backbone.Collection) {
          view.el += "[data-model='"+view.model.cid+"']";
        }
        this.call(view, {model : view.model});
      }
    }
  });
  
}).call(Bone);

/* Utility functions */

var log = function() {
	var arg = arguments[0];
	arg && !(_.isString(arg) || _.isNumber(arg) || _.isBoolean(arg)) ? 
		console.dir.apply(console, arguments) :
		console.log.apply(console, arguments);
};