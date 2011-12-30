var App  = {},
    Todo = {};
	  
_.extend(App, {
  todos  : [Todo, 0],
  '$submit' : function(el, context, event) {
    this.todos.add({ title : $('input', el).val() });
    event.preventDefault();
  }
});

_.extend(Todo, {
  title  : 'My Todo',
  isDone : false,
  '$click [type="checkbox"]' : function(event){
    this.isDone = event.target.checked;
  },
  '$click .destroy' : function(el, context, event) {
    this._remove();
  }
});

Unicycle.setup({
  app      : App,
  template : '#template',
  options  : {
    startOnReady : true
  }
}).update({
  todos : [
    { title : 'Wake up in the morning.' },
    { title : 'Have bowl of cereal.' },
    { title : 'See friends at bus stop.' },
    { title : 'Determine which seat to take.' }
  ]
});