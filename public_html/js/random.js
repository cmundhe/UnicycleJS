isGameOver : /*_.memoize(*/function(){
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
    }/*, function() {
      return JSON.toString(this.cells.pluck('value'))
    })*/,


'$init cells' : function() {
      return Array(Math.pow(this.dimension,2));
    },
    
    '$init winRows' : function() {
      var winRows = [],
          n = this.dimension, i, j;
      for (i = 2*(n+1); i--) winRows.push([]);
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
    
    '$init players' : function() {
      return [{ symbol : 'X' }, { symbol : 'O' }];
    }
