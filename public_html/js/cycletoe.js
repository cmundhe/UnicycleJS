(function() {
 
  var App    = {}, 
      Player = {},
      Cell   = {};
  
  _.extend(App, {
    dimension     : 3,
    currentPlayer : 0,
    cells : [Cell, function(){
      return Math.pow(this.dimension, 2)
    }],
    players : [Player, function(){
      return [{symbol: 'X'}, {symbol: 'O'}];
    }],
    width : function(){
      return this.dimension * 61;
    },
    winRows : function(){
      var winRows = [],
          n = this.dimension, i, j;
      for (i = 2*(n+1); i--;) winRows.push([]);
      for (i = 0; i < n; i++) {
        for (j = 0; j < n; j++) {
        winRows[j].push(j*n+i);
        winRows[j+n].push(i*n+j);
        }
        winRows[j+n].push(i*(n+1));
        winRows[j+1+n].push((i+1)*(n-1));
      }
      return winRows;
    },
    isGameOver : function(){
      var n       = this.dimension,
          cells   = this.cells,
          winRows = this.winRows,
          value, i, j;
      for (i = 0; i < winRows.length; i++) {
        if (value = cells[winRows[i][0]].value) {
          for (j = 1; j < n; j++) {
            if (value == cells[winRows[i][j]].value) {
              if (j+1 == n) return true;
            } else break;
          }
        }
      }
      return false
    },
    '$initialize' : function() {
      this._observe('dimension', ['cells', 'winRows', 'width']);
    },
    '$keyup' : function(el, context, event) {
      switch (event.keyCode) {
        case 38: this.dimension++; break;
        case 40: this.dimension > 2 && this.dimension--;
      }
    }
  });
  
  _.extend(Cell, {
    value : '',
    '$initialize' : function(context) {
      this._observe('value', 'isGameOver', this._app);
    },
    '$click' : function(el, context, event) {
      var app = this._app;
      this.value === '' && 
        (this.value = app.players[app.currentPlayer].symbol);
      return function() {
        app.isGameOver ?
          alert(app.players[app.currentPlayer].symbol + ' wins!') :
          app.currentPlayer = +!app.currentPlayer;
        return false;
      }
    }
  });
  
  _.extend(Player, {
    symbol : ''
  });
  
  Unicycle.setup({
    app       : App,
    template  : '#template',
    options   : {
      startOnReady : true,
      cache        : false
    }
  });
  
})();