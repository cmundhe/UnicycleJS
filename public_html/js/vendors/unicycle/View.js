(function(undefined) {

// Unicycle.View
// -----------------------------------------------------------------------------
// Renders ViewModel data in templates and delegates events
// Returns DOM nodes rather than an HTML string. For event delegation
// to work without user-defined selectors, parent rendering scope has to maintain
// references to DOM nodes created in child scopes.

  this.View = this.Object.extend(
  
  // Prototype
  // ---------------------------------------------------------------------------
  {
    // Constructor
    // -------------------------------------------------------------------------
    constructor : function(data) {
      
      this.ViewModel  = isViewModelArray(data) ?
        data.ViewModel : 
        data.constructor;
      
      this.data       = data;
      this.events     = this.ViewModel.events || {};
      this.context    = false;
      this.nodes      = [];
      this.childViews = [];
      this.cid        = _.uniqueId('view');
      
      data._view  = this;
      
      this.refresh();
      
      if (_.isFunction(this.events.initialize))
        this.ViewModel.invoke(data, this.events.initialize);
        
      return this;
    },

    // Properties
    // -------------------------------------------------------------------------
    browserEvents : [],
    eventSplitter : null,
    
    // Methods
    // -------------------------------------------------------------------------
    /*collapse : function (index, childViews, arrChildViews) {
    
      arrChildViews || (arrChildViews = []);    
      var i = 0, j = 0, childView, arrChildView;
      
      while (childView = childViews[i++]) {
      
        // Result will either match an existing result or be undefined
        while (arrChildView = arrChildViews[j++] && 
          childView.data.constructor != arrChildView.data.constructor);
        
        // If undefined, create a new result
        if (!arrChildView) {
          
          arrChildView = {
            data       : [],
            nodes      : [],
            childViews : [],
            context    : false
          };
          
          arrChildViews.push(arrChildView);
        }
        
        arrChildView.data[index]  = childView.data,
        arrChildView.nodes[index] = childView.nodes,
        arrChildView.childViews   = this.collapse(index, childView.childViews, []);
      }
      
      return arrChildViews;
    },*/

    refresh : function() {
      
      var data = this.data,
          i    = 0, 
          j, childViews, nodes;
      
      if (isViewModelArray(data)) {
        
        childViews = [];
        nodes      = [];
        
        var View = data.ViewModel.View, 
            childView;
    
        for (j = data.length; i < j; i++) {
          childView  = new View(data[i]);
          //childViews = this.collapse(i, childView.childViews, childViews);
          nodes[i]   = childView.nodes;
        }
      
      } else {
        
        // Create a dummy div.
        // Not a documentFragment b/c it lacks innerHTML property.
        var el        = document.createElement('div'),
            innerHTML = '',
            placeholders;
            
        childViews = this.template(data);
        
        // Set innerHTML of dummy div, using placeholders for HTMLElements.
        // Leverage innerHTML's speed of DOM element creation.
        while ((j = childViews[i]) != null) {
          if (isPrimitive(j) || _.isArray(j)) {
            innerHTML += childViews.splice(i, 1);
          } else {
            if (isViewModel(j)) {
              childViews[i++] = new j.constructor.View(j);
              innerHTML += '<div class="__p"></div>';
            } else if (isViewModelArray(j)) {
              childViews[i++] = new j.ViewModel.View(j);
              innerHTML += '<div class="__p"></div>';
            }
          }
        }
        el.innerHTML = innerHTML;
        
        // Select placeholders. Possible conflict with class '__p'.
        placeholders = el.getElementsByClassName('__p');
        
        // Determine if placeholders have unique contexts and replace.
        // If no context, there will be a performance hit during event handling.
        // Backwards iteration b/c placeholder array is a live collection.
        while(i--) {
        
          j = placeholders[i];
          
          // Set context only if placeholder has a parent (that is not el) and no element siblings.
          childViews[i].context = 
              j.parentNode != el && 
              !j.nextElementSibling && 
              !j.previousElementSibling && 
              j.parentNode;
          
          // Try to eliminate jQuery call.
          $(j).replaceWith(_.flatten(childViews[i].nodes));
        }
        
        nodes = slice(el.childNodes);
      }
      
      // Remove old nodes and add new nodes.
      while (this.nodes.pop());
      this.nodes.push.apply(this.nodes, nodes);
      this.childViews = childViews;
      
      return this;
    },
    render : function(dontRefresh) {
      
      var docFrag    = document.createDocumentFragment(),
          oldNodes   = _.flatten(this.nodes),
          parent     = oldNodes[0] && oldNodes[0].parentNode,
          context    = this.context || parent;
      
      dontRefresh || this.refresh();

      var nodes      = _.flatten(this.nodes),
          childViews = this.childViews;
          i = 0, l = nodes.length;
      
      // Build document fragment    
      while (i < l)
        docFrag.appendChild(nodes[i++]);
      
      if (!dontRefresh && oldNodes) {
      
        // Remove all old nodes and replace with document fragment.
        while (oldNodes.length > 1)
          parent.removeChild(oldNodes.pop());
        parent.replaceChild(docFrag, oldNodes[0]);
        
        // Re-delegate childViews.
        for (i = 0, l = childViews.length; i < l; i++)
          childViews[i].delegateEvents(context);
          
      } else {
        context.appendChild(docFrag);
        this.delegateEvents(context);
      }
      
      return this;
      
    },
    delegateEvents : function(context) {
      
      var view          = this,
          ViewModel     = view.ViewModel,
          data          = view.data,
          events        = view.events,
          context       = view.context || context,
          nodes         = view.nodes,
          childViews    = view.childViews,
          cid           = view.cid,
          browserEvents = view.browserEvents,
          splitter      = view.eventSplitter;
          
      _.each(events, function(handler, eventString) {
        
        var matches       = eventString.match(splitter),
            namespace     = (matches[2] || '') + '.' + cid,
            event         = matches[1] + namespace,
            selector      = matches[3]  || '',
            browserEvent  = !!~browserEvents.indexOf(event),
            eventContext  = browserEvent ? window : context,
            target, targetData, dataIndex, i;
        
        $(eventContext).delegate(selector, event, function(event) {
          
          target     = event.target;
          targetData = data;
          
          if (!browserEvent && (!view.context || isViewModelArray(data))) {
            if ((dataIndex = view.indexOfData(nodes, context, target)) === false)
              return view;
            else if (_.isArray(dataIndex)) {
              while ((i = dataIndex.pop()) != null) targetData = targetData[i];
            }
          }
          
          // Prepend passed arguments to default arguments.
          var args = slice(arguments, 1);
          args.push(target, context, event);
          
          // Invoke handler.
          ViewModel.invoke(targetData, function(){
            return handler.apply(targetData, args)
          });
          
          return view;
          
        });
        
      });
      
      for (var i = 0, l = childViews.length; i < l; i++)
        childViews[i].delegateEvents(context);
        
      return this;
    },
    indexOfData : function (nodes, context, target, dataIndex) {
      
      var index = nodes.length;
      
      if (_.isArray(nodes[index-1])) {
        while(index--) {
          if (this.indexOfData(nodes[index], context, target, index)) {
            return dataIndex ? 
              [index].concat(dataIndex) :
              [index];
          }
        }
      } else if (index) {
        while (target != context) {
          if (~nodes.indexOf(target))
            return true;
          target = target.parentNode;
        }
      }
      return false;
    }
  },
  
  // Static
  // -----------------------------------
  {
    // Template engine compile method. Configure in Unicycle.setup().
    compile : null,
    // Create a new subclass with a compiled template function.
    create   : function(str) {
      return this.extend({
        template : this.compile(str+'<% return __p; %>')
      });
    }
  });

}).call(Core);