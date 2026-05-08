// src/js/todo.js
export default function createTodo({
  title,
  description = '',
  dueDate = '',
  priority = 'medium',
  notes = '',
  checklist = [],
  id = Date.now(),
  completed = false
} = {}) {
  return {
    id,
    title,
    description,
    dueDate,
    priority,
    notes,
    checklist,
    completed
  };
}