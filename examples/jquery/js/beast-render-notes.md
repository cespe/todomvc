**3. A render that doesn't lie**

In TodoMVC jQuery, `render` does much more than render data.

Perhaps a more appropriate name would be `renderAndSave` or `renderish`. This is bad. You don't want to lie to people in your code. Not just because it's dishonest, but also because it is really damn confusing.

Your job is to rewrite the app to make `render` honest. That means there shouldn't be any calls to `util.store`. Use `displayTodos` from Practical JavaScript for inspiration.

Forked from Gordon's version of TodoMVC and a link to this repository posted at https://github.com/gordonmzhu/beasts/issues/6.

The solution is to move the call to `util.store` out of `render` and into each function that changes todos. Conveniently, each of those functions also calls `render`, so it is a simple matter of finding each `render` call and adding a line to call `util.store`.
```
		// displayTodos from Practical Javascript only does one thing.
		// I'm removing util.store so that render only does one thing.
		// util.store can go in each function that calls render.
		render: function () {
			var todos = this.getFilteredTodos();
			$('#todo-list').html(this.todoTemplate(todos));
			$('#main').toggle(todos.length > 0);
			$('#toggle-all').prop('checked', this.getActiveTodos().length === 0);
			this.renderFooter();
			$('#new-todo').focus();
			//util.store('todos-jquery', this.todos);
		},
```
