// src/js/project.js
export default function createProject(name, id = Date.now()) {
  const todos = [];

  return {
    id,
    name,
    todos,
    addTodo(todo) {
      this.todos.push(todo);
    },
    removeTodo(todoId) {
      this.todos = this.todos.filter(todo => todo.id !== todoId);
    },
    getTodo(todoId) {
      return this.todos.find(todo => todo.id === todoId);
    }
  };
}