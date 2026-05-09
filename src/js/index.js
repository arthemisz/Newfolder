// src/js/index.js
import '../css/style.css';
import createProject from './project';
import createTodo from './todo';
import { saveProjects, loadProjects } from './storage';
import {
  renderProjects,
  renderTodos,
  openModal,
  closeModal,
  resetTodoForm,
  populateTodoForm,
  addChecklistItemToDOM,
  getFormChecklist,
  formatDate
} from './dom';

// ========== STATE ==========
let projects = [];
let currentProjectId = null;
let pendingDeleteCallback = null; // for confirm modal

// ========== INITIALIZATION ==========
function initializeApp() {
  const stored = loadProjects();
  if (stored && stored.length > 0) {
    // Rebuild project objects with their methods
    projects = stored.map(projectData => {
      const rebuiltProject = createProject(projectData.name, projectData.id);
      rebuiltProject.todos = projectData.todos || [];
      return rebuiltProject;
    });
  } else {
    const defaultProject = createProject('My Tasks');
    projects.push(defaultProject);
    saveProjects(projects);
  }
  currentProjectId = projects[0].id;
  renderAll();
  attachGlobalListeners();
}

// ========== RENDERING ==========
function renderAll() {
  const currentProject = getCurrentProject();
  renderProjects(projects, currentProjectId, selectProject, handleDeleteProject);
  if (currentProject) {
    renderTodos(currentProject, handleEditTodo, handleDeleteTodo);
  }
}

function getCurrentProject() {
  return projects.find(p => p.id === currentProjectId);
}

// ========== EVENT LISTENERS ==========
function attachGlobalListeners() {
  // Sidebar toggle
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('sidebar--open');
    document.getElementById('sidebarOverlay').classList.toggle('sidebar-overlay--visible');
  });
  document.getElementById('sidebarOverlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('sidebar--open');
    document.getElementById('sidebarOverlay').classList.remove('sidebar-overlay--visible');
  });

  // Add Project button
  document.getElementById('addProjectBtn').addEventListener('click', () => {
    openModal('projectModal');
    document.getElementById('projectForm').reset();
  });

  // Add Todo button
  document.getElementById('addTodoBtn').addEventListener('click', () => {
    if (!currentProjectId) return;
    resetTodoForm();
    openModal('todoModal');
  });

  // Close modals (cancel buttons, close icons)
  document.getElementById('closeTodoModalBtn').addEventListener('click', () => closeModal('todoModal'));
  document.getElementById('cancelTodoBtn').addEventListener('click', () => closeModal('todoModal'));
  document.getElementById('closeProjectModalBtn').addEventListener('click', () => closeModal('projectModal'));
  document.getElementById('cancelProjectBtn').addEventListener('click', () => closeModal('projectModal'));
  document.getElementById('closeConfirmModalBtn').addEventListener('click', () => closeModal('confirmModal'));
  document.getElementById('cancelConfirmBtn').addEventListener('click', () => closeModal('confirmModal'));

  // Close modals when clicking backdrop
  document.querySelectorAll('.modal__backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', () => {
      const modal = backdrop.closest('.modal');
      if (modal) closeModal(modal.id);
    });
  });

  // Project form submit
  document.getElementById('projectForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('projectName');
    const name = nameInput.value.trim();
    if (!name) {
      showError(nameInput);
      return;
    }
    const newProject = createProject(name);
    projects.push(newProject);
    currentProjectId = newProject.id;
    saveProjects(projects);
    renderAll();
    closeModal('projectModal');
    nameInput.classList.remove('input-error');
  });

  // Todo form submit
  document.getElementById('todoForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('todoTitle');
    const title = titleInput.value.trim();
    if (!title) {
      showError(titleInput);
      return;
    }
    const todoId = document.getElementById('todoId').value;
    const description = document.getElementById('todoDescription').value.trim();
    const dueDate = document.getElementById('todoDueDate').value;
    const priority = document.getElementById('todoPriority').value;
    const notes = document.getElementById('todoNotes').value.trim();
    const checklist = getFormChecklist();

    const currentProject = getCurrentProject();
    if (!currentProject) return;

    if (todoId) {
      // Editing existing todo
      const existing = currentProject.getTodo(Number(todoId));
      if (existing) {
        existing.title = title;
        existing.description = description;
        existing.dueDate = dueDate;
        existing.priority = priority;
        existing.notes = notes;
        existing.checklist = checklist;
      }
    } else {
      // New todo
      const newTodo = createTodo({ title, description, dueDate, priority, notes, checklist });
      currentProject.addTodo(newTodo);
    }

    saveProjects(projects);
    renderAll();
    closeModal('todoModal');
    titleInput.classList.remove('input-error');
  });

  // Add checklist item button
  document.getElementById('addChecklistItemBtn').addEventListener('click', () => {
    addChecklistItemToDOM();
  });

  // Confirm delete action
  document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    if (pendingDeleteCallback) {
      pendingDeleteCallback();
      pendingDeleteCallback = null;
    }
    closeModal('confirmModal');
  });
}

// ========== HANDLERS ==========
function selectProject(projectId) {
  currentProjectId = projectId;
  renderAll();
  // Close sidebar on mobile after selection
  document.getElementById('sidebar').classList.remove('sidebar--open');
  document.getElementById('sidebarOverlay').classList.remove('sidebar-overlay--visible');
}

function handleEditTodo(todoId) {
  const project = getCurrentProject();
  if (!project) return;
  const todo = project.getTodo(todoId);
  if (!todo) return;
  populateTodoForm(todo);
  openModal('todoModal');
}

function handleDeleteTodo(todoId) {
  const project = getCurrentProject();
  if (!project) return;
  const todo = project.getTodo(todoId);
  if (!todo) return;

  document.getElementById('confirmMessage').textContent = `Delete task "${todo.title}"?`;
  pendingDeleteCallback = () => {
    project.removeTodo(todoId);
    saveProjects(projects);
    renderAll();
  };
  openModal('confirmModal');
}

function handleDeleteProject(projectId) {
  if (projects.length <= 1) {
    alert('You must keep at least one project.');
    return;
  }
  const projectToDelete = projects.find(p => p.id === projectId);
  if (!projectToDelete) return;

  document.getElementById('confirmMessage').textContent = `Delete project "${projectToDelete.name}" and all its tasks?`;
  pendingDeleteCallback = () => {
    projects = projects.filter(p => p.id !== projectId);
    if (currentProjectId === projectId) {
      currentProjectId = projects[0].id;
    }
    saveProjects(projects);
    renderAll();
  };
  openModal('confirmModal');
}

// ========== UTILS ==========
function showError(inputElement) {
  inputElement.classList.add('input-error');
  inputElement.addEventListener('input', function removeError() {
    inputElement.classList.remove('input-error');
    inputElement.removeEventListener('input', removeError);
  });
}

// ========== START APP ==========
document.addEventListener('DOMContentLoaded', initializeApp);