<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<meta http-equiv="Pragma" content="no-cache"/> 
	<meta http-equiv="Expires" content="-1" /> 
	
	<title>UnicycleJS</title>
	
	<link rel="stylesheet" type="text/css" href="css/reset.css" />
	<link rel="stylesheet" type="text/css" href="css/vendors/syntaxhighlighter/shCore.css" />
	<link rel="stylesheet" type="text/css" href="css/vendors/syntaxhighlighter/shThemeDefault.css" />
	<link rel="stylesheet" type="text/css" href="css/index.css" />
	
	<script type="text/javascript" src="js/vendors/syntaxhighlighter/shCore.js"></script>
	<script type="text/javascript" src="js/vendors/syntaxhighlighter/shBrushXml.js"></script>
	<script type="text/javascript" src="js/vendors/syntaxhighlighter/shBrushJScript.js"></script>
	<script type="text/javascript" src="js/vendors/jquery/jquery.min.js"></script>
	<!--<script id="template" type="text/html" src="templates/template.html"></script>
	<script type="text/javascript" src="js/vendors/json/json2.min.js"></script>
	<script type="text/javascript" src="js/vendors/underscore/underscore.js"></script>
	<script type="text/javascript" src="js/vendors/unicycle/unicycle.min.js"></script>-->
	<script type="text/javascript" src="js/index.js"></script>
</head>

<body>
	<div id="container">
		<!--<div id="header">
			<!--<div id="logo"><a href="">Unicycle<em>JS</em></a></div>
			<ul id="nav">
				<li><a class="active" href="">Overview</a></li>
				<li><a href="">Docs</a></li>
				<li><a href="">Examples</a></li>
				<li><a href="">About</a></li>
			</ul>
		</div>--->
		<div id="splash">
			<div class="unicycle"></div>
			<div class="heading"></div>
			<p>A lightweight JavaScript framework that provides structure and convenience for single-page AJAX applications.</p>
			<ul class="downloads">
				<li><a href="">0.1.0 Source (50kb)</a></li>
				<li><a href="">0.1.0 Minified (4kb)</a></li>
			</ul>
		</div>
		<ul id="separator">
			<!--<li>
				<h1>"Native" feel</h1>
				<p>Unicycle automatically syncs UI and data model state to create a fluid single-page experience akin to native apps.</p>
			</li>
			<li>
				<h1>Ultra concise code</h1>
				<p>Define view data, templates, and event logic. Unicycle does the rest.</p>
			</li>
			<li>
				<h1>AJAX done right</h1>
				<p>Unicycle ensures that all URLs are pretty, bookmarkable, and crawlable.</p>
			</li>-->
		</ul>
		
		<div id="content">
			
			<div id="sidebar">
				
				<div class="sidebox">
					<h1>Features</h1>
					 <ul>
					  	<li>Automatic syncing of data and DOM state</li>
					  	<li>Flexible and logic-free client-side templating</li>
					  	<li>Backbone-style API for reading from and writing to RESTful backend</li>
					  	<li>Clean, crawlable URLs</li>
					  	<li>Fewer HTTP requests</li>
					  	<li>Extremely lightweight (3kb minified)</li>
					  	<li>Cross-browser support (IE7+, Gecko, Webkit)</li>
					  </ul>
				</div>
				
				<div class="sidebox">
					<h1>Dependencies</h1>
					  <ul>
					  	<li><a href="http://jquery.com/">jQuery 1.6+</a></li>
					  	<li><a href="https://github.com/documentcloud/underscore/">Underscore 1.2</a></li>
					  	<li><a href="https://github.com/douglascrockford/JSON-js">JSON 2</a></li>
					  </ul>
				</div>
				
				<!--<div class="sidebox">
					<h1>Roadmap</h1>
					  <ul>
					  	<li>Add support for subscription.</li>
					  	<li>Google search.</li>
					  	<li>Make jQuery optional.</li>
					  	<li>Support other templating engines (jQuery, Mustache, etc..).</li>
					  </ul>
				</div>-->
				
			</div>
			
			<div id="main">
				<h1 style="margin-top: 0" >Overview</h1>
				<p>Implementing a rich web UI with the single-page look and feel of a native application is a cumbersome process. The code for even unsophisticated web apps can quickly turn into a contemptible mess of DOM queries and AJAX calls. Frameworks such as <a href="http://documentcloud.github.com/backbone/">Backbone</a> have made huge strides in bringing structure to JavaScript-heavy applications, but they still require developers to manage an excessive number of event bindings and object definitions. In the wrong hands, using Backbone can yield code that is more difficult to maintain than a naive spaghetti of jQuery selectors.</p>

<p>Unicycle resolves these frustrations. You simply have to define an object that extends your application's data model with data and event logic necessary for the UI. From there, Unicycle keeps UI state in sync with data coming in from the server, handles all events, manages URL history, and locally persists data -- generally facilitating client-side development in the most concise, intuitive, and dignified (i.e. no evals) manner possible.</p>

<p>Although Unicycle technically follows a <a href="http://en.wikipedia.org/wiki/Model_View_ViewModel">Model-View-ViewModel (MVVM)</a> design pattern, it tremendously reduces the pains associated with declaring, instantiating, and syncing the different tiers of an architectured application.
</p>
<p>Unicycle relies on <a href="http://jquery.com/">jQuery</a> for AJAX and event delegation, and <a href="https://github.com/documentcloud/underscore/">Underscore</a> for several utility methods. <a href="https://github.com/douglascrockford/JSON-js">JSON 2</a> is recommended to support JSON parsing in older browsers. Unicycle is currently only compatible with its bundled templating engine (a slightly modified version of Underscore micro-templating).</p>

<p>Track and contribute to the project on <a href="https://github.com/cmundhe/Unicycle">GitHub</a>.</p>
				
				<h1>Basics</h1>
				<h2>View Models</h2>
				<p>Perhaps the biggest difference between Unicycle and Backbone-like frameworks is the fact that you <strong>never explicitly define constructors or create instances of any objects</strong>.</p>
				
				<p>Instead, all you have to do is define a nested object that contains default and/or computed values for data to be rendered. Unicycle will convert each nested object (and the parent object itself) into the prototype of a brand-new constructor. When data arrives from the server, Unicycle uses these constructors to create abstract object representations of UI state called view models.</p>
				
				<script type="syntaxhighlighter" class="brush: js"><![CDATA[
			    
			    // To define view models for our app, first compose a nested object..
			    var Newspaper = {
			    	title  : 'My Section',
			    	editor : {
			    		firstName : 'My',
			    		lastName  : 'Editor'
			    	};
			    };
			    // ..and then pass it to Unicycle.App.define().
			    Unicycle.App.define({
			    	viewModel : Newspaper
			    });
			    // Unicycle expands Newspaper into a constructor for the root view model
			    // of the application. Newspaper.editor, a nested object, is also expanded
			    // into a view model constructor.
			    
			    
			    // Suppose the server responds to an HTTP request with:
			    [response] = {
			    	title  : 'New York Times',
			    	editor : {
			    		firstName : 'Bob'
			    	};
			    };
			    
			    // Unicycle automatically updates the root view model to this:
			    [rootViewModel] = {
			    	title  : 'New York Times',
			    	editor : {
			    		firstName : 'Bob',
			    		lastName  : 'Editor' // Default value specified in Newspaper.editor.
			    	} 
			    };]]></script>
			    
				<!--<script type="syntaxhighlighter" class="brush: js"><![CDATA[
			    var Section = {
			    	title    : 'MySection',
			    	articles : {
			    		headline : 'MyArticle',
			    	},
			    	numArticles : function() {
			    		return this.articles.length;
			    	}
			    };]]></script>-->
				
				<p>Note that the structure of Newspaper mirrors that of our server response. This makes sense, because we want to <em>augment</em> served data with any additional data we wish to render.</p>
				
				
				<h2>Templating</h2>
				<p>.... The names of view model attributes are important because they correspond directly to property names in the template(s) that you define. Unicycle enforces a naming convention whereby each view model maps to a partial template of the same name.</p>
				
				<h2>Events</h2>
				<p>...</p>
				
				<h2>Observers</h2>
				<p>...</p>
				
				<h2>AJAX API</h2>
				<p>...</p>
				
				<h2>History</h2>
				<p>...</p>
				
				<h1>Examples</h1>
				<h2>Implementing <a href="http://documentcloud.github.com/backbone/examples/todos/index.html">Backbone Todos</a> with Unicycle</h2>
				<p><em>This example assumes some familiarity with object-oriented JavaScript, jQuery selection, client-side templating engines, and Backbone-like frameworks. Also, it does not cover many essential features of Unicycle such as its Observer pattern and server interactions.</em></p>
				
				<p>Consider a simple Todo app where tasks can be dynamically added, marked as complete, and removed. To implement this using Unicycle, start by defining an object representation of the application data.</p>
				
				<script type="syntaxhighlighter" class="brush: js"><![CDATA[
			    var AppViewModel = {
			      todos : {
			        title  : 'My Todo',
			        isDone : false
			       }
			    };
			      
			    Unicycle.App.define({
			      viewModel : AppViewModel,
			      template  : "#template"
			    });]]></script>
			    
			    <p>There are a couple important points here.</p>
			    <p>When we pass AppViewModel to Unicycle.App.define, Unicycle expands AppViewModel and each of its nested objects into constructors. Thus, AppViewModel will become a constructor with a prototype property "todos", which itself points to a constructor with prototype properties "title" and "complete". AppViewModel and todos are treated as distinct view models.</p>
			    <p>Upon instantiation of AppViewModel, we expect that its todos property will refer to the array of todo items that will be added by the client. So it may seem odd that todos is defined as a singular object. With Backbone, todos would be explicitly declared as a Collection, with a separate object defining the attributes of an individual todo item. Unicycle instead dynamically determines whether data should be instantiated as a view model or as a collection of view models (called a view array).</p>
			    
			    <p>Next, we need to write a template to determine how our todos will be rendered:</p>			
				<script type="syntaxhighlighter" class="brush: xml"><![CDATA[
			      <script id="template" type="text/html">			      
				      <form>
				        <h1>Todos</h1>
				        <input type='text' value='What needs to be done?'/>
				        <ul class='todos'&gt;{{todos}}&lt;/ul>
				      </form>
				      
				      {{#todos}}
				      <li class={{isDone && 'done'}}>
				        <div class='text'>{{title}}</div>
				        <div class='destroy'></div>
				      </li>
			      &lt;/script>]]></script>
			      
			      <p>Unicycle templating is based on Underscore micro-templating -- with a few key changes. By default, Unicycle retains Underscore's ERB-style &lt;% .. %&gt; syntax for block statements, but replaces its single-expression interpolation syntax with double-bracket notation {{ .. }}. Further, Unicycle supports inline declaration of partial templates using the {{#..}} tag. The names of partial templates must match the property name of the view model it renders.</p>
			      <p>Our template is divided into two parts by the {{#todos}} tag. Everything above it is scoped to our root view model, AppViewModel. The markup below {{#todos}} is a partial template scoped to the todos model. Note that there is no closing tag for {{#todos}}. If you wanted to define another partial template for another nested view model called "foo", you would simply add a tag {{#foo}} followed by its associated markup.</p>
			      
			      <p>Now let's go back to our ViewModel definitions and write some event logic:</p>
			      
			      <script type="syntaxhighlighter" class="brush: js"><![CDATA[
			      var AppViewModel = {
			        todos  : {
			          title  : 'My Todo',
			          isDone : false,
			          events : {
			            'click .destroy' : function(event) {
			              delete this;
			            }
			          }
			        },
			        events : {
			          'submit .new-todo' : function(event) {
			            this.todos.push({
			              title : $('input', event.target).val()
			            });
			            event.preventDefault();
			          }
			        }
			      };]]></script>
			      
			      <p>Event logic for each view model is specified in the reserved property "events". Attribute names within the events object are jQuery selectors, and attribute values are the corresponding event handlers. This pattern is similar to the way in which events are defined with Backbone, except here the events are included as a property in our data model rather than in a separate View object.</p>
			      
			      <p>Let's populate the app with some data and start Unicycle:</p>
			      
			      <script type="syntaxhighlighter" class="brush: js"><![CDATA[
			      Unicycle.App.create({
			        todos : [
			        	{ title : 'Wake up in the morning.' }
			        	{ title : 'Have bowl of cereal.' }
			        	{ title : 'See friends at bus stop.' }
			        	{ title : 'Determine which seat to take.' }
			        ]
			      });
			      
			      // On DOM Ready
			      $(function(){
			        Unicycle.App.start();
			      });]]></script>
			     
			      <p>After applying styles, this is what our app looks like:</p>
			      
			      <iframe id="todos0" src="todos0.html">
			      	<p>Your browser does not support iframes.</p>
			      </iframe>
			      
			      <h2>Content Management System (CMS) Example</h2>
			      <p>...</p>
			      <h1>Documentation</h1>
			      <p>...</p>
			      <h1>Comparison</h1>
			      <p>...</p>
			      <h1>About</h1>
			      <img class="self-photo" src="images/chiraag-mundhe.png" />
			      <div class="self-photo caption">Chiraag Mundhe, climate skeptic.</div>
			      <p>Unicycle is under active development by <a href="http://flavors.me/chiraag">Chiraag Mundhe</a>, formerly of <a href="http://macheist.com">MacHeist</a> and <a href="http://mydreamapp.com">MyDreamApp</a>.</p>
			      <p>Site design and illustration by Chiraag Mundhe.</p>
			      
			      <h1 style="clear:left;">Roadmap</h1>
			      <p>...</p>
			</div>
			
		</div>
		
		<div id="footer">
			<p>Copyright 2011 <strong>Unicycle<em>JS</em></strong></p>
		</div>
		
	</div>
</body>
</html>