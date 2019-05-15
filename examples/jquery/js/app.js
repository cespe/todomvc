/* Unfamiliar concepts
 *
 * Useful links
 *
 * Implement undo
 * Need to restore last state of todos array data
 * Need to restore last state of todos filter
 * Start with a small, useful undo for destroy()
 * Keep the previous states of todos array in an 'undo' array
 * On clicking 'undo' button, run function undo that
 * 	
 
 * Bugs found along the way
 *
 */


/*global Handlebars, Router */
( function () {
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
			// jQuery.html() uses innerHTML
			this.todoTemplate = Handlebars.compile(document.getElementById('todo-template').innerHTML);
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
			document.getElementById('new-todo').addEventListener('keyup', this.create.bind(this));
			document.getElementById('toggle-all').addEventListener('change', this.toggleAll.bind(this));
			document.getElementById('footer')
					.addEventListener('click', this.destroyCompleted.bind(this)); // target #clear-completed
			document.getElementById('todo-list').addEventListener('change', this.toggle.bind(this)) // target .toggle
			document.getElementById('todo-list').addEventListener('dblclick', this.edit.bind(this)); // target label
			document.getElementById('todo-list').addEventListener('keyup', this.editKeyup.bind(this)); // target .edit
			document.getElementById('todo-list').addEventListener('click', this.destroy.bind(this)); // target .destroy
			document.getElementById('todo-list').addEventListener('focusout', this.update.bind(this)); // target .edit
		},
		render: function () {
			var todos = this.getFilteredTodos();
			var tmpl = this.todoTemplate(todos);
			document.getElementById('todo-list').innerHTML = tmpl;
			// jQuery toggle hides or shows by setting the display style inline
			if (todos.length > 0) {
				document.getElementById('main').style.display = 'block';
			} else {
				document.getElementById('main').style.display = 'none';
			}
			if (this.getActiveTodos().length === 0) {
				document.getElementById('toggle-all').checked = true;
			} else {
				document.getElementById('toggle-all').checked = false;
			}
			this.renderFooter();
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

			// jQuery toggle hides or shows by setting the display style inline
			if ( todoCount > 0 ) {
				document.getElementById('footer').innerHTML = template;
				document.getElementById('footer').style.display = 'block';
			} else {
				document.getElementById('footer').style.display = 'none';
			}
		},
		toggleAll: function (e) {
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
			var id = el.closest('li').getAttribute('data-id');
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
})();
