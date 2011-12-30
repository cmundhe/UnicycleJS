// Views
var AppView = Bone.View.extend({
  
  initialize : function(){ this.bind('render', this.resizeGrid, this) },
  
  el       : '#game',
  template : '#app',
  
  events   : {
    'blur input' : function(){
      var val;
      if (Number(val = $('input', this.el).val()) == val && val != false) {
        this.model.set({ dimension : +val });
      }
    }
  },
  
  resizeGrid : function(){
    var model = this.model,
        cellWidth = $(model.get('cells').models[0].view.el).outerWidth(),
        dimension = model.get('dimension');
    $('#grid', this.el).css({width: (dimension * cellWidth) });
  }
  
}),

CellView = Bone.View.extend({
	el       : '.cell',
	template : '#cell',
	events : {
		'click' : function() {
		  var model     = this.model,
		      curPlayer = app.get('curPlayer');  
		  !model.get('value') && model.set({value : ['X','O'][curPlayer]});
		}
	}
});

// Models
var Cell = Bone.Model.extend({
	defaults : { value : '' }, 
	view : CellView
}),

Cells = Bone.Collection.extend({ model : Cell }),

App = Bone.Model.extend({
  
  initialize : function(attributes, options) {
    this.bind('change:dimension', this.makeCells, this);
    this.trigger('change:dimension');
  },
  
  makeCells : function(){
    var dimension    = this.get('dimension'),
        cells        = [],
        cellsLength  = Math.pow(dimension, 2),
        combinations = [],
        combosLength = 2 * (dimension + 1),
        i, j;
        
    for (i = cellsLength;  i--; cells.push({}));
    for (i = combosLength; i--; combinations.push([]));
        
    for (i = 0; i < dimension; i++) {
      for (j = 0; j < dimension; j++) {
        combinations[j].push(i + j * dimension);
        combinations[j + dimension].push(i * dimension + j);
      }
      combinations[j++ + dimension].push(i * (dimension+1));
      combinations[j + dimension].push((i+1) * (dimension-1));
    }
    
    this.set({ cells : cells, combinations : combinations });
    
    for (var i = cellsLength; i--;) {
      var cell = this.get('cells').models[i];
      cell.bind('change:value', this.isGameOver, this);
    }
  },
  
  isGameOver : function(){
    
    this.set({curPlayer : +!this.get('curPlayer')});
    
    var cells        = this.get('cells'),
        combinations = this.get('combinations'),
        dimension    = this.get('dimension'),
        value, i, j;
        
    for (i = 0; i < combinations.length; i++) {
      if (value = cells.models[combinations[i][0]].get('value')) {
        for (j = 1; j < dimension; j++) {
          if (value == cells.models[combinations[i][j]].get('value')) {
            if (j + 1 < dimension) continue;
            alert('Game Over');
            return true;
          } else break;
        }
      }
    }
    return false
  },
  
  defaults : {
    cells     : Cells,
    curPlayer : 0,
    dimension : 3
  },
  
  view : AppView
});

var app;

// DOM Ready
$(function() {
	app = new App();
});