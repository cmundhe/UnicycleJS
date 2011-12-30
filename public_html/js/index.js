$(function(){
  
  // Initialize syntax highlighting
  SyntaxHighlighter.defaults['toolbar'] = false;
  SyntaxHighlighter.defaults['gutter']  = false;
  SyntaxHighlighter.all();
  
  // Automatically resize todos example
  $('#todos0').load(function(){
    var iframe = this,
    		body   = this.contentDocument.body,
    		resize = function(){
    			$(iframe).css({ height : $(body).height() });
    		};
    $(body).click(resize);
    $('form', body).live('submit', resize);
    resize();
  });
  
});