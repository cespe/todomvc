   3. A render that doesn't lie
In TodoMVC jQuery, render does much more than render data.

Perhaps a more appropriate name would be renderAndSave or renderish. This is bad. You don't want to lie to people in your code. Not just because it's dishonest, but also because it is really damn confusing.

Your job is to rewrite the app to make render honest. That means there shouldn't be any calls to util.store. Use displayTodos from Practical JavaScript for inspiration.

Fork my version of TodoMVC and then post a link to your repository here: https://github.com/gordonmzhu/beasts/issues/6.


From Practical Javascript todos version 9
var view = {
  displayTodos: function() {
    var todosUl = document.querySelector('ul');
    todosUl.innerHTML = '';
    todoList.todos.forEach(function(todo, position) {
      var todoLi = document.createElement('li');
      var todoTextWithCompletion = '';

      if (todo.completed === true) {
        todoTextWithCompletion = '(x) ' + todo.todoText;
      } else {
        todoTextWithCompletion = '( ) ' + todo.todoText;
      }
      
      todoLi.id = position;
      todoLi.textContent = todoTextWithCompletion;
      todoLi.appendChild(this.createDeleteButton());
      todosUl.appendChild(todoLi);
    }, this);
  },
