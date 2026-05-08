// src/js/storage.js
const STORAGE_KEY = 'taskflow_projects';

export function saveProjects(projects) {
  try {
    const serialized = JSON.stringify(projects);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

export function loadProjects() {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return null;
    return JSON.parse(serialized);
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
}