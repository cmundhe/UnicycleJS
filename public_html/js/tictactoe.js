var isGameOver = function(){
		var value, i, j;
		outer: for (i = 0; i < this.combinations.length; i++) {
			if (value = this.cells[this.combinations[i][0]].value) {
				for (j = 1; j < this.dimension; j++) {
					if (this.cells[this.combinations[i][j]].value != value) {
						continue outer;
					}
				}
				return true;
			}
		}
		return false		
},

Cells     = {},
ViewModel = {
	
	curPlayer : 0,
	dimension : 3,
	cells     : Cells,
	
	events : {	
		
		initialize : function() {
			
			var dimension    = this.dimension,
					cells        = [], 
					combinations = [],
					combosLength  = 2 * (dimension + 1),
					cellsLength  = Math.pow(dimension, 2),
					i;
					
			for (i = cellsLength;  i--; cells.push({})); 
	    for (i = combosLength; i--; combinations.push([]));
	    
	    for (i = 0; i < dimension; i++) {
	      for (var j = 0; j < dimension; j++) {
	        combinations[j].push(i + j * dimension);
	        combinations[j + dimension].push(i * dimension + j);
	      }
	      combinations[j++ + dimension].push(i * (dimension+1));
      	combinations[j + dimension].push((i+1) * (dimension-1));
	    }
	    
			Unicycle.App.Observer(this).observe('cells');
			return { cells : cells, combinations : combinations }
		}
	}
	
};

_.extend(Cells, {
	value  : '',
	events : {
		'click' : function(event){
			var viewModel = Unicycle.App._viewModel;
			!this.value && (this.value = ['X', 'O'][viewModel.curPlayer]);
			if (isGameOver.call(viewModel)) {
				return function(){ alert('Game Over! ' + ['X', 'O'][viewModel.curPlayer] + ' wins!') }
			}
			viewModel.curPlayer = +!viewModel.curPlayer;
		},
	}
});

Unicycle.App.define({
	viewModel : ViewModel,
	template  : '#template'
});

$(function(){
	Unicycle.App.start();
});