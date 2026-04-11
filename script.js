let tasks = [
  {
    id: 1,
    title: "Design a logo",
    dueDate: new Date(Date.now() + 3600000 * 2).toISOString(),
    priority: "high",
    completed: false,
  },
  {
    id: 2,
    title: "Create wireframes for mobile app",
    dueDate: new Date(Date.now() + 3600000 * 6).toISOString(),
    priority: "medium",
    completed: true,
  },
  {
    id: 3,
    title: "Write project documentation",
    dueDate: new Date(Date.now() - 3600000 * 1).toISOString(),
    priority: "low",
    completed: false,
  },
  {
    id: 4,
    title: "Get to work as urgent as possible",
    dueDate: new Date(Date.now() + 3600000 * 24).toISOString(),
    priority: "high",
    completed: false,
  },
  {
    id: 5,
    title: "Review code for security vulnerabilities",
    dueDate: new Date(Date.now() + 3600000 * 12).toISOString(),
    priority: "medium",
    completed: true,
  },
  {
    id: 6,
    title: "Prepare presentation slides",
    dueDate: new Date(Date.now() + 3600000 * 48).toISOString(),
    priority: "low",
    completed: false,
  },
];

let currentFilter = "all";

document.addEventListener("DOMContentLoaded", () => {
  updateDateDisplay();
  renderTasks();
  startTimer();

  // Set default date to 24 hours from now
  const tomorrow = new Date();
  tomorrow.setHours(tomorrow.getHours() + 24);
  document.getElementById("due-date-input").value = tomorrow
    .toISOString()
    .slice(0, 16);
});

function updateDateDisplay() {
  const now = new Date();
  const options = { weekday: "long", month: "long", day: "numeric" };
  document.getElementById("currentdate").textContent = now.toLocaleDateString(
    undefined,
    options,
  );
}

function addTask() {
  const taskInput = document.getElementById("task-input");
  const dueDateInput = document.getElementById("due-date-input");
  const priorityInput = document.getElementById("priority-input");

  const title = taskInput.value.trim();

  if (!title) {
    taskInput.style.borderColor = "red";
    setTimeout(() => (taskInput.style.borderColor = ""), 1000);
    return;
  }

  const newTask = {
    id: Date.now(),
    title: title,
    dueDate: dueDateInput.value || new Date().toISOString(),
    priority: priorityInput.value,
    completed: false,
  };

  tasks.unshift(newTask);
  taskInput.value = "";
  renderTasks();
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    renderTasks();
  }
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  renderTasks();
}

function filterTasks(filter, event) {
  currentFilter = filter;
  document
    .querySelectorAll(".filter-button")
    .forEach((btn) => btn.classList.remove("active"));
  if (event) event.target.classList.add("active");
  renderTasks();
}

function toggleAllTasks() {
  const allCompleted = tasks.every((task) => task.completed);
  tasks.forEach((task) => (task.completed = !allCompleted));
  renderTasks();
}

function renderTasks() {
  const taskList = document.getElementById("task-list");
  const emptyState = document.getElementById("empty-state");

  let filtered = tasks;
  if (currentFilter === "completed")
    filtered = tasks.filter((t) => t.completed);
  if (currentFilter === "active") filtered = tasks.filter((t) => !t.completed);

  // Sort: i solved the sorting issue by first sorting by completion status and then by due date
  filtered.sort((a, b) =>
    a.completed === b.completed
      ? new Date(a.dueDate) - new Date(b.dueDate)
      : a.completed - b.completed,
  );

  taskList.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";
    filtered.forEach((task) => {
      const div = document.createElement("div");
      div.className = `task-item ${task.completed ? "completed" : ""}`;
      div.setAttribute("data-testid", `test-task-item-${task.id}`);

      const timeStatus = getTimeStatus(task.dueDate, task.completed);

      div.innerHTML = `
        <div class="checkbox-wrapper">
            <input type="checkbox" ${task.completed ? "checked" : ""} onchange="toggleTask(${task.id})" data-testid="test-task-checkbox-${task.id}">
            <div class="custom-checkbox"></div>
        </div>
        <div class="task-content">
            <div class="task-header">
                <span class="task-title" style="color: #333" data-testid="test-task-title-${task.id}">${escapeHtml(task.title)}</span>
                <span class="priority-badge priority-${task.priority}" data-testid="test-task-priority-${task.id}">${task.priority}</span>
            </div>
            <div class="task-meta">
                <span data-testid="test-task-due-date-${task.id}">📅 ${new Date(task.dueDate).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                <span class="status-indicator ${timeStatus.class}" data-testid="test-task-status-${task.id}">${timeStatus.text}</span>
            </div>
        </div>
        <div class="task-actions">
            <button class="button-edit" onclick="openEditModal(${task.id})" data-testid="test-edit-button-${task.id}">✏️</button>
            <button class="button-delete" onclick="deleteTask(${task.id})" data-testid="test-delete-button-${task.id}">🗑️</button>
        </div>
      `;
      taskList.appendChild(div);
    });
  }
  updateProgress();
}

function getTimeStatus(dueDate, isCompleted) {
  if (isCompleted) return { text: "Done", class: "status-completed" };
  const diff = new Date(dueDate) - new Date();
  if (diff < 0) return { text: "Overdue", class: "status-overdue" };
  if (diff < 3600000) return { text: "Soon", class: "status-due-soon" };
  return { text: "Active", class: "status-active" };
}

function updateProgress() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById("progress-bar").style.width = `${percent}%`;
  document.getElementById("progress-bar").textContent = `${percent}%`;
  document.getElementById("progresspercent").textContent = `${percent}%`;
  document.getElementById("remainingtask").textContent =
    `${total - completed} tasks remaining`;
}

// Modal Logic
function openEditModal(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  document.getElementById("edit-task-id").value = id;
  document.getElementById("edit-task-input").value = task.title;
  document.getElementById("edit-time-input").value = new Date(task.dueDate)
    .toISOString()
    .slice(0, 16);
  document.getElementById("edit-priority-input").value = task.priority;
  document.getElementById("task-modal").classList.add("active");
}

function closeModal() {
  document.getElementById("task-modal").classList.remove("active");
}

function saveTask() {
  const id = parseInt(document.getElementById("edit-task-id").value);
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.title = document.getElementById("edit-task-input").value;
    task.dueDate = document.getElementById("edit-time-input").value;
    task.priority = document.getElementById("edit-priority-input").value;
    renderTasks();
    closeModal();
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function startTimer() {
  setInterval(renderTasks, 60000); // Refresh UI every minute for "Overdue" status
}
