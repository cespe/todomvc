/* Unfamiliar concepts
 * 1. The global wrapper jQuery(function ($) {...});
 * 2. $el variable $el = $(el)
 * 		This turns out to be a convention to reinforce (I guess) that the variable holds a jQuery object
 * 3. $input.val($input.val())
 * 		Apparently voodoo to set the cursor at the end of the input entry
 * 4. Toggle-All checkbox behavior according to spec "toggles all the todos to the same state as itself"
 * 		In practice, this appears to mean that when the checkbox is gray/false, it will make all the todos completed
 * 		but when it is black/true, it will set all todos to active. It's weird to have an active control that is grayed out.
 *
 * Useful links
 * The todomvc spec https://github.com/tastejs/todomvc/blob/master/app-spec.md
 *
 *
 * Process to strip out jQuery
 * For each jQuery call (identified by $() and chained methods)
 *   Figure out what the call is returning or doing
 *   Replace with regular dom methods that return or do the same thing
 * Finally, figure out how to replace jQuery wrapper with a different wrapper
 
 * Bugs found along the way
 *   Cursor doesn't go to end of entry when editing a todo
 *   	Fixed in current versions at todomvc.com
 *   Escape key doesn't clear the input for a new entry (bug in original too)
 *   Can't trigger debugger in App.edit if bindEvent is set to dblclick (can't in glitch original either)
 *   	Solution uncheck 'Toggle device toolbar' in web inspector
 *   Hitting return/enter when updating an entry leaves the destroy button active/visible in the line just updated,
 *   even though the new-todo field gains focus. Bug in original and in current live versions too.
 *
 */


/*global jQuery, Handlebars, Router */
jQuery(function ($) {
	'use strict';

	Handlebars.registerHelper('eq', function (a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;

	var util = {
		uuid: function () {
			/*jshint bitwise:false */
			var i, random;
			var uuid = '';

			for (i = 0; i < 32; i++) {
				random = Math.random() * 16 | 0;
				if (i === 8 || i === 12 || i === 16 || i === 20) {
					uuid += '-';
				}
				uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
			}

			return uuid;
		},
		pluralize: function (count, word) {
			return count === 1 ? word : word + 's';
		},
		store: function (namespace, data) {
			if (arguments.length > 1) {
				return localStorage.setItem(namespace, JSON.stringify(data));
			} else {
				var store = localStorage.getItem(namespace);
				return (store && JSON.parse(store)) || [];
			}
		}
	};

	var App = {
		init: function () {
			this.todos = util.store('todos-jquery');
			// replace  Handlebars.compile($('#todo-template').html())
			// jQuery.html() uses innerHTML
			this.todoTemplate = Handlebars.compile(document.getElementById('todo-template').innerHTML);
			// replace  Handlebars.compile($('#footer-template').html())
			this.footerTemplate = Handlebars.compile(document.getElementById('footer-template').innerHTML);
			this.bindEvents();

			new Router({
				'/:filter': function (filter) {
					this.filter = filter;
					this.render();
				}.bind(this)
			}).init('/all');
		},
		bindEvents: function () {
			//$('#new-todo').on('keyup', this.create.bind(this));
			document.getElementById('new-todo').addEventListener('keyup', this.create.bind(this));
			//$('#toggle-all').on('change', this.toggleAll.bind(this));
			document.getElementById('toggle-all').addEventListener('change', this.toggleAll.bind(this));
			//$('#footer').on('click', '#clear-completed', this.destroyCompleted.bind(this));
			document.getElementById('footer')
					.addEventListener('click', this.destroyCompleted.bind(this)); // target #clear-completed
			document.getElementById('todo-list').addEventListener('change', this.toggle.bind(this)) // target .toggle
			document.getElementById('todo-list').addEventListener('dblclick', this.edit.bind(this)); // target label
			document.getElementById('todo-list').addEventListener('keyup', this.editKeyup.bind(this)); // target .edit
			document.getElementById('todo-list').addEventListener('click', this.destroy.bind(this)); // target .destroy
			document.getElementById('todo-list').addEventListener('focusout', this.update.bind(this)); // target .edit
			//$('#todo-list')
				//.on('change', '.toggle', this.toggle.bind(this))
				//.on('dblclick', 'label', this.edit.bind(this))
				//.on('keyup', '.edit', this.editKeyup.bind(this))
				//.on('focusout', '.edit', this.update.bind(this))
				//.on('click', '.destroy', this.destroy.bind(this));
		},
		render: function () {
			var todos = this.getFilteredTodos();
			//$('#todo-list').html(this.todoTemplate(todos));
			var tmpl = this.todoTemplate(todos);
			document.getElementById('todo-list').innerHTML = tmpl;
			//$('#main').toggle(todos.length > 0);
			// jQuery toggle hides or shows by setting the display style inline
			if (todos.length > 0) {
				document.getElementById('main').style.display = 'block';
			} else {
				document.getElementById('main').style.display = 'none';
			}
			//$('#toggle-all').prop('checked', this.getActiveTodos().length === 0);
			if (this.getActiveTodos().length === 0) {
				document.getElementById('toggle-all').checked = true;
			} else {
				document.getElementById('toggle-all').checked = false;
			}
			this.renderFooter();
			//$('#new-todo').focus();
			document.getElementById('new-todo').focus();
			util.store('todos-jquery', this.todos);
		},
		renderFooter: function () {
			var todoCount = this.todos.length;
			var activeTodoCount = this.getActiveTodos().length;
			var template = this.footerTemplate({
				activeTodoCount: activeTodoCount,
				activeTodoWord: util.pluralize(activeTodoCount, 'item'),
				completedTodos: todoCount - activeTodoCount,
				filter: this.filter
			});

		//	$('#footer').toggle(todoCount > 0).html(template);
			// jQuery toggle hides or shows by setting the display style inline
			if ( todoCount > 0 ) {
				document.getElementById('footer').innerHTML = template;
				document.getElementById('footer').style.display = 'block';
			} else {
				document.getElementById('footer').style.display = 'none';
			}
		},
		toggleAll: function (e) {
			//var isChecked = $(e.target).prop('checked');
			var isChecked = e.target.checked;

			this.todos.forEach(function (todo) {
				todo.completed = isChecked;
			});

			this.render();
		},
		getActiveTodos: function () {
			return this.todos.filter(function (todo) {
				return !todo.completed;
			});
		},
		getCompletedTodos: function () {
			return this.todos.filter(function (todo) {
				return todo.completed;
			});
		},
		getFilteredTodos: function () {
			if (this.filter === 'active') {
				return this.getActiveTodos();
			}

			if (this.filter === 'completed') {
				return this.getCompletedTodos();
			}

			return this.todos;
		},
		destroyCompleted: function (e) {
			// without jQuery, must test for correct target
			if (e.target.id === 'clear-completed') {
				this.todos = this.getActiveTodos();
				this.filter = 'All';
				this.render();
			}
		},
		// accepts an element from inside the `.item` div and
		// returns the corresponding index in the `todos` array
		indexFromEl: function (el) {
			var id = $(el).closest('li').data('id');
			var todos = this.todos;
			var i = todos.length;

			while (i--) {
				if (todos[i].id === id) {
					return i;
				}
			}
		},
		create: function (e) {
			var $input = e.target;
			var val = $input.value.trim();

			if (e.which !== ENTER_KEY || !val) {
				return;
			}

			this.todos.push({
				id: util.uuid(),
				title: val,
				completed: false
			});

			$input.value = '';

			this.render();
		},
		toggle: function (e) {
			// without jQuery, must test for correct target, 'toggle' class in this case
			if (e.target.classList.contains('toggle')) {
				var i = this.indexFromEl(e.target);
				this.todos[i].completed = !this.todos[i].completed;
				this.render();
			}
		},
		edit: function (e) {
			// without jQuery, must test for correct target, 'label' element in this case
			if (e.target.nodeName === 'LABEL') {
				//var $input = e.target.closest('li').classList.add('editing').find('.edit');
				var targetLi = e.target.closest('li');
				targetLi.classList.add('editing');
				var $input = targetLi.querySelector('.edit');
				
				//$input.val($input.val()).focus();
// 				this confusing construct has to do with moving cursor to end
//				Gordon discusses this in vid 3 minute 31 and just removes it but his app was already setting the
//				cursor at the beginning anyway.
//				In the online version of jQuery todomvc, the code is revised to make it clear that the extra step
//				is to put the cursor at the end of the line
				
				$input.focus();		// sets cursor at beginning
			}
		},
		editKeyup: function (e) {
			// without jQuery, must test for correct target, 'edit' class in this case
			if (e.target.classList.contains('edit')) {
				if (e.which === ENTER_KEY) {
					e.target.blur();
				}

				if (e.which === ESCAPE_KEY) {
					//$(e.target).data('abort', true).blur();
					e.target.setAttribute('data-abort', true);
					e.target.blur();
				}
			}
		},
		update: function (e) {
			// without jQuery, must test for correct target, 'edit' class in this case
			if (e.target.classList.contains('edit')) {
				var el = e.target;
				// var $el = $(el);
				var val = el.value.trim();

				if (!val) {
					this.destroy(e);
					return;
				}

				// if ($el.data('abort')) {
				// 	 $el.data('abort', false);
				if (el.getAttribute('data-abort')) {	// could also use el.dataset.abort
					el.setAttribute('data-abort', false);	// or el.dataset.abort = false
				} else {
					this.todos[this.indexFromEl(el)].title = val;
				}
			}

			this.render();
		},
		destroy: function (e) {
			// without jQuery, must test for correct target, 'destroy' class in this case
			if (e.target.classList.contains('destroy')) {
				this.todos.splice(this.indexFromEl(e.target), 1);
				this.render();
			}
		}
	};

	App.init();
});
