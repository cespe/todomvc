/* Unfamiliar concepts
 * 1. The global wrapper jQuery(function ($) {...});
 * 2. $el variable $el = $(el)
 *
 * Useful links
 * The todomvc spec https://github.com/tastejs/todomvc/blob/master/app-spec.md
 *
 *
 * Process to strip out jQuery
 * For each jQuery call (identified by $() and chained methods)
 *   Figure out what the call is returning
 *   Replace with regular dom methods that return the same thing
 * Finally, figure out how to replace jQuery wrapper with a different wrapper
 
 * Bugs found along the way
 *   Cursor doesn't go to end of entry when editing a todo
 *   Escape key doesn't clear the input for a new entry (bug in original too)
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
			document.getElementById('footer').addEventListener('click', this.destroyCompleted.bind(this));
			document.getElementById('todo-list').addEventListener('change', this.toggle.bind(this)) // target .toggle
			document.getElementById('todo-list').addEventListener('dblclick', this.edit.bind(this)); // target label
			document.getElementById('todo-list').addEventListener('keyup', this.editKeyup.bind(this)); // target .edit
			document.getElementById('todo-list').addEventListener('click', this.destroy.bind(this)); // target .destroy
			$('#todo-list')
				//.on('change', '.toggle', this.toggle.bind(this))
				//.on('dblclick', 'label', this.edit.bind(this))
				//.on('keyup', '.edit', this.editKeyup.bind(this))
				.on('focusout', '.edit', this.update.bind(this))
				//.on('click', '.destroy', this.destroy.bind(this));
		},
		render: function () {
			var todos = this.getFilteredTodos();
			$('#todo-list').html(this.todoTemplate(todos));
			$('#main').toggle(todos.length > 0);
			$('#toggle-all').prop('checked', this.getActiveTodos().length === 0);
			this.renderFooter();
			$('#new-todo').focus();
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

			$('#footer').toggle(todoCount > 0).html(template);
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
				var targetLi = e.target.closest('li');
				targetLi.classList.add('editing');
//				var $input = e.target.closest('li').classList.add('editing').find('.edit');
				var $input = targetLi.querySelector('.edit');
//				$input.val($input.val()).focus(); // this confusing construct has to do with moving cursor to end
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
					$(e.target).data('abort', true).blur();
				}
			}
		},
		update: function (e) {
			var el = e.target;
			var $el = $(el);
			var val = $el.val().trim();

			if (!val) {
				this.destroy(e);
				return;
			}

			if ($el.data('abort')) {
				$el.data('abort', false);
			} else {
				this.todos[this.indexFromEl(el)].title = val;
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
