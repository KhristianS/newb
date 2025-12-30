const taskForm = document.querySelector('#task-form');
const taskList = document.querySelector('#task-items');
const emptyCopy = document.querySelector('#empty-copy');
const statusFilter = document.querySelector('#filter-status');
const priorityFilter = document.querySelector('#filter-priority');
const searchFilter = document.querySelector('#filter-search');
const resetFilters = document.querySelector('#reset-filters');
const clearAll = document.querySelector('#clear-all');
const addSample = document.querySelector('#add-sample');
const statTotal = document.querySelector('#stat-total');
const statComplete = document.querySelector('#stat-complete');
const statFocus = document.querySelector('#stat-focus');

const STORAGE_KEY = 'focusflow-tasks';
const priorityRank = (value) => ({ high: 3, medium: 2, low: 1 }[value] || 0);

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    console.error('Unable to load tasks', error);
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createTask(data) {
  return {
    id: crypto.randomUUID(),
    title: data.title.trim(),
    notes: data.notes.trim(),
    priority: data.priority,
    due: data.due,
    done: false,
    createdAt: Date.now(),
  };
}

function formatDate(value) {
  if (!value) return 'No due date';
  const options = { month: 'short', day: 'numeric' };
  return new Date(value).toLocaleDateString(undefined, options);
}

function renderStats(tasks) {
  const completed = tasks.filter((task) => task.done).length;
  statTotal.textContent = tasks.length;
  statComplete.textContent = completed;
  statFocus.textContent = tasks.length ? `${Math.round((completed / tasks.length) * 100)}%` : '0%';
}

function matchesFilters(task) {
  const matchesStatus =
    statusFilter.value === 'all' || (statusFilter.value === 'done' ? task.done : !task.done);
  const matchesPriority = priorityFilter.value === 'all' || task.priority === priorityFilter.value;
  const term = searchFilter.value.trim().toLowerCase();
  const matchesSearch = !term ||
    task.title.toLowerCase().includes(term) ||
    task.notes.toLowerCase().includes(term);
  return matchesStatus && matchesPriority && matchesSearch;
}

function renderTasks() {
  const tasks = loadTasks();
  taskList.innerHTML = '';

  const filtered = tasks.filter(matchesFilters);
  emptyCopy.textContent = filtered.length ? '' : 'No tasks match the current filters.';

  const template = document.querySelector('#task-template');

  filtered
    .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority) || a.createdAt - b.createdAt)
    .forEach((task) => {
      const item = template.content.cloneNode(true);
      const checkbox = item.querySelector('.task__checkbox');
      const title = item.querySelector('.task__title');
      const notes = item.querySelector('.task__notes');
      const meta = item.querySelector('.task__meta');
      const badge = item.querySelector('.badge');
      const deleteBtn = item.querySelector('.task__delete');

      title.textContent = task.title;
      notes.textContent = task.notes || 'No notes yet';
      meta.textContent = `${formatDate(task.due)} · Added ${new Date(task.createdAt).toLocaleDateString()}`;
      badge.textContent = task.priority;
      badge.classList.add(task.priority);
      checkbox.checked = task.done;

      const taskElement = item.querySelector('.task');
      if (task.done) {
        taskElement.classList.add('task--done');
      }

      checkbox.addEventListener('change', () => {
        const updated = loadTasks().map((entry) =>
          entry.id === task.id ? { ...entry, done: checkbox.checked } : entry
        );
        saveTasks(updated);
        renderTasks();
        renderStats(updated);
      });

      deleteBtn.addEventListener('click', () => {
        const updated = loadTasks().filter((entry) => entry.id !== task.id);
        saveTasks(updated);
        renderTasks();
        renderStats(updated);
      });

      taskList.appendChild(item);
    });

  renderStats(tasks);
}

function handleSubmit(event) {
  event.preventDefault();
  const formData = new FormData(taskForm);
  const data = Object.fromEntries(formData.entries());

  if (!data.title.trim()) {
    return;
  }

  const tasks = loadTasks();
  tasks.push(createTask(data));
  saveTasks(tasks);
  taskForm.reset();
  renderTasks();
  renderStats(tasks);
}

function attachFilters() {
  [statusFilter, priorityFilter, searchFilter].forEach((input) => {
    input.addEventListener('input', renderTasks);
  });

  resetFilters.addEventListener('click', () => {
    statusFilter.value = 'all';
    priorityFilter.value = 'all';
    searchFilter.value = '';
    renderTasks();
  });
}

function attachBulkActions() {
  clearAll.addEventListener('click', () => {
    saveTasks([]);
    renderTasks();
    renderStats([]);
  });

  addSample.addEventListener('click', () => {
    const seed = [
      {
        title: 'Review designs and finalize copy',
        notes: 'Align with the design team and confirm CTA labels.',
        priority: 'high',
        due: new Date().toISOString().slice(0, 10),
      },
      {
        title: 'Deep focus: ship onboarding checklist',
        notes: 'Draft steps, add screenshots, and check for broken links.',
        priority: 'medium',
        due: '',
      },
      {
        title: 'Book customer interview slots',
        notes: 'Send Calendly to this week\'s beta users.',
        priority: 'low',
        due: '',
      },
    ].map((task) => ({ ...task, notes: task.notes, id: crypto.randomUUID(), done: false, createdAt: Date.now() }));

    saveTasks(seed);
    renderTasks();
    renderStats(seed);
  });
}

function init() {
  renderTasks();
  attachFilters();
  attachBulkActions();
  taskForm.addEventListener('submit', handleSubmit);
}

init();
