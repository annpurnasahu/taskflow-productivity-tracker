
const STORAGE_KEY = "taskflowTasks";
const THEME_KEY = "taskflowTheme";

let tasks = [];
let currentFilter = "all";
let currentCategory = "all";
let editingTaskId = null;

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskCategory = document.getElementById("taskCategory");
const taskPriority = document.getElementById("taskPriority");
const taskDate = document.getElementById("taskDate");
const taskList = document.getElementById("taskList");
const searchInput = document.getElementById("searchInput");
const priorityFilter = document.getElementById("priorityFilter");
const emptyMessage = document.getElementById("emptyMessage");

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    tasks = Array.isArray(savedTasks)
      ? savedTasks.map(task => ({
          ...task,
          id: task.id || `${Date.now()}-${Math.random()}`,
          priority: task.priority || "Medium",
          category: task.category || "Personal",
          completed: Boolean(task.completed)
        }))
      : [];
  } catch {
    tasks = [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

taskForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const title = taskInput.value.trim();
  if (!title) return;

  if (editingTaskId) {
    tasks = tasks.map(task =>
      task.id === editingTaskId
        ? {
            ...task,
            title,
            category: taskCategory.value,
            priority: taskPriority.value,
            dueDate: taskDate.value
          }
        : task
    );
    editingTaskId = null;
  } else {
    tasks.unshift({
      id: createId(),
      title,
      category: taskCategory.value,
      priority: taskPriority.value,
      dueDate: taskDate.value,
      completed: false,
      createdAt: new Date().toISOString()
    });
  }

  saveTasks();
  taskForm.reset();
  renderApp();
});

function deleteTask(id) {
  if (!confirm("Are you sure you want to delete this task?")) return;
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderApp();
}

function toggleTask(id) {
  tasks = tasks.map(task =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderApp();
}

function editTask(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;

  editingTaskId = id;
  taskInput.value = task.title;
  taskCategory.value = task.category;
  taskPriority.value = task.priority;
  taskDate.value = task.dueDate || "";
  taskInput.focus();
  document.getElementById("taskForm").scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function isOverdue(task) {
  if (!task.dueDate || task.completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${task.dueDate}T00:00:00`);
  return due < today;
}

function renderStats() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const active = total - completed;
  const overdue = tasks.filter(isOverdue).length;
  const percentage = total ? Math.round((completed / total) * 100) : 0;

  document.getElementById("totalTasks").textContent = total;
  document.getElementById("activeTasks").textContent = active;
  document.getElementById("completedTasks").textContent = completed;
  document.getElementById("overdueTasks").textContent = overdue;
  document.getElementById("progressPercentage").textContent = `${percentage}%`;
  document.getElementById("progressBar").style.width = `${percentage}%`;
}

function renderTasks() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const selectedPriority = priorityFilter.value;

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm);
    const matchesPriority =
      !selectedPriority || task.priority === selectedPriority;

    const matchesStatus =
      currentFilter === "all" ||
      (currentFilter === "active" && !task.completed) ||
      (currentFilter === "completed" && task.completed);

    const matchesCategory =
      currentCategory === "all" || task.category === currentCategory;

    return matchesSearch && matchesPriority && matchesStatus && matchesCategory;
  });

  taskList.replaceChildren();

  filteredTasks.forEach(task => {
    const item = document.createElement("article");
    item.className = `task-item${task.completed ? " completed" : ""}`;

    const left = document.createElement("div");
    left.className = "task-left";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", "Mark task complete");
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const info = document.createElement("div");
    info.className = "task-info";

    const title = document.createElement("h3");
    title.textContent = task.title;

    const details = document.createElement("div");
    details.className = "task-meta";

    const category = document.createElement("span");
    category.className = `category ${task.category}`;
    category.textContent = task.category;

    const priority = document.createElement("span");
    priority.className = `priority ${task.priority}`;
    priority.textContent = `${task.priority} Priority`;

    details.append(category, priority);

    if (task.dueDate) {
      const date = document.createElement("span");
      date.textContent = `Due: ${task.dueDate}`;
      if (isOverdue(task)) date.classList.add("overdue");
      details.append(date);
    }

    info.append(title, details);
    left.append(checkbox, info);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => editTask(task.id));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteTask(task.id));

    actions.append(editButton, deleteButton);
    item.append(left, actions);
    taskList.append(item);
  });

  emptyMessage.style.display = filteredTasks.length ? "none" : "block";
}

function renderApp() {
  renderStats();
  renderTasks();
}

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    currentCategory = "all";

    document.querySelectorAll(".nav-item").forEach(item =>
      item.classList.remove("active")
    );
    button.classList.add("active");

    document.querySelectorAll(".category-link").forEach(item =>
      item.classList.remove("active")
    );

    renderTasks();
  });
});

document.querySelectorAll(".category-link").forEach(button => {
  button.addEventListener("click", () => {
    currentCategory = button.dataset.category;
    currentFilter = "all";

    document.querySelectorAll(".category-link").forEach(item =>
      item.classList.remove("active")
    );
    button.classList.add("active");

    document.querySelectorAll(".nav-item").forEach(item =>
      item.classList.remove("active")
    );

    renderTasks();
  });
});

searchInput.addEventListener("input", renderTasks);
priorityFilter.addEventListener("change", renderTasks);

document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const theme = document.body.classList.contains("dark-mode") ? "dark" : "light";
  localStorage.setItem(THEME_KEY, theme);
});

function loadTheme() {
  if (localStorage.getItem(THEME_KEY) === "dark") {
    document.body.classList.add("dark-mode");
  }
}

document.getElementById("exportBtn").addEventListener("click", () => {
  const data = JSON.stringify(tasks, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "taskflow-tasks.json";
  link.click();

  URL.revokeObjectURL(url);
});

loadTasks();
loadTheme();
renderApp();
