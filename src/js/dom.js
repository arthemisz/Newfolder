// src/js/dom.js
import { format, parseISO, isValid } from 'date-fns';

// Helper to format date with date-fns
export function formatDate(dateString) {
  if (!dateString) return '';
  const parsed = parseISO(dateString);
  if (!isValid(parsed)) return dateString;
  return format(parsed, 'MMM dd, yyyy');
}

// Renders the project sidebar
export function renderProjects(projects, currentProjectId, onSelectProject, onDeleteProject) {
  const list = document.getElementById('projectList');
  if (!list) return;
  list.innerHTML = '';

  projects.forEach(project => {
    const li = document.createElement('li');
    li.className = `project-item${project.id === currentProjectId ? ' project-item--active' : ''}`;
    li.innerHTML = `
      <span class="project-item__name">${escapeHTML(project.name)}</span>
      <span class="project-item__count">${project.todos.length}</span>
    `;

    li.addEventListener('click', (e) => {
      // Prevent delete button click from triggering selection
      if (e.target.closest('.project-item__delete')) return;
      onSelectProject(project.id);
    });

    // Delete button for projects (except default one – we'll handle in index)
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'project-item__delete btn--icon';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.setAttribute('aria-label', 'Delete project');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onDeleteProject(project.id);
    });
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

// Renders todos for the currently selected project
export function renderTodos(project, onEditTodo, onDeleteTodo) {
  const container = document.getElementById('todoListContainer');
  const emptyState = document.getElementById('emptyState');
  const countElement = document.getElementById('todoCount');
  const titleElement = document.getElementById('currentProjectTitle');

  if (!container || !emptyState) return;

  titleElement.textContent = project.name;
  countElement.textContent = `${project.todos.length} task${project.todos.length !== 1 ? 's' : ''}`;

  container.innerHTML = '';
  if (project.todos.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  // Sort by due date ascending (optional)
  const sorted = [...project.todos].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  sorted.forEach(todo => {
    const card = createTodoCard(todo, onEditTodo, onDeleteTodo);
    container.appendChild(card);
  });
}

function createTodoCard(todo, onEditTodo, onDeleteTodo) {
  const card = document.createElement('div');
  card.className = 'todo-card';
  card.dataset.todoId = todo.id;

  // Priority color bar
  const priorityClass = `todo-card--${todo.priority}`;
  card.classList.add(priorityClass);

  const dueDateFormatted = todo.dueDate ? formatDate(todo.dueDate) : '';

  card.innerHTML = `
    <div class="todo-card__header">
      <h3 class="todo-card__title">${escapeHTML(todo.title)}</h3>
      <span class="todo-card__due ${todo.dueDate ? '' : 'todo-card__due--none'}">
        ${dueDateFormatted || 'No due date'}
      </span>
    </div>
    ${todo.description ? `<p class="todo-card__desc">${escapeHTML(todo.description)}</p>` : ''}
    <div class="todo-card__footer">
      <span class="todo-card__priority-label">
        <span class="priority-dot priority-dot--${todo.priority}"></span>
        ${todo.priority}
      </span>
      <div class="todo-card__actions">
        <button class="btn--icon edit-todo-btn" aria-label="Edit task">✏️</button>
        <button class="btn--icon delete-todo-btn" aria-label="Delete task">🗑️</button>
      </div>
    </div>
  `;

  // Event listeners
  card.querySelector('.edit-todo-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    onEditTodo(todo.id);
  });
  card.querySelector('.delete-todo-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    onDeleteTodo(todo.id);
  });

  // Click on card to expand/edit (we'll treat as edit)
  card.addEventListener('click', () => onEditTodo(todo.id));

  return card;
}

// Modal handling
export function openModal(modalId) {
  document.getElementById(modalId).classList.add('modal--open');
}

export function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('modal--open');
}

export function resetTodoForm() {
  document.getElementById('todoForm').reset();
  document.getElementById('todoId').value = '';
  document.getElementById('todoModalTitle').textContent = 'Add New Task';
  const checklistContainer = document.getElementById('checklistContainer');
  if (checklistContainer) checklistContainer.innerHTML = '';
}

export function populateTodoForm(todo) {
  document.getElementById('todoId').value = todo.id;
  document.getElementById('todoTitle').value = todo.title;
  document.getElementById('todoDescription').value = todo.description || '';
  document.getElementById('todoDueDate').value = todo.dueDate || '';
  document.getElementById('todoPriority').value = todo.priority || 'medium';
  document.getElementById('todoNotes').value = todo.notes || '';
  document.getElementById('todoModalTitle').textContent = 'Edit Task';

  // Populate checklist
  const checklistContainer = document.getElementById('checklistContainer');
  checklistContainer.innerHTML = '';
  if (todo.checklist && todo.checklist.length) {
    todo.checklist.forEach((item, index) => {
      addChecklistItemToDOM(item, index);
    });
  }
}

export function addChecklistItemToDOM(text = '', index = null) {
  const container = document.getElementById('checklistContainer');
  const itemDiv = document.createElement('div');
  itemDiv.className = 'checklist-item';
  itemDiv.innerHTML = `
    <input type="text" class="form-input checklist-input" placeholder="Checklist item" value="${escapeHTML(text)}" maxlength="200">
    <button type="button" class="btn--icon remove-checklist-btn" aria-label="Remove item">✕</button>
  `;
  itemDiv.querySelector('.remove-checklist-btn').addEventListener('click', () => {
    itemDiv.remove();
  });
  if (index !== null) {
    itemDiv.dataset.index = index;
  }
  container.appendChild(itemDiv);
}

export function getFormChecklist() {
  const items = document.querySelectorAll('.checklist-input');
  return Array.from(items).map(input => input.value.trim()).filter(Boolean);
}

// Escape HTML to prevent XSS
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}