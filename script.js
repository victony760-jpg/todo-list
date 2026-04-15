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
let editingTaskId = null;
let expandedTasks = new Set();

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
      div.onclick = (e) => {
        // Don't toggle expand if clicking on buttons, inputs, or checkboxes
        if (!e.target.closest("button, input, select")) {
          toggleExpand(task.id);
        }
      };

      const timeStatus = getTimeStatus(task.dueDate, task.completed);
      const isEditing = editingTaskId === task.id;
      const isExpanded = expandedTasks.has(task.id);

      div.innerHTML = `
        <div class="checkbox-wrapper">
            <input type="checkbox" ${task.completed ? "checked" : ""} onchange="toggleTask(${task.id})" data-testid="test-task-checkbox-${task.id}">
            <div class="custom-checkbox"></div>
        </div>
        <div class="task-content">
            <div class="task-header">
                ${
                  isEditing
                    ? `<input type="text" class="edit-title-input" value="${escapeHtml(task.title)}" data-task-id="${task.id}">
                  <select class="edit-priority" data-task-id="${task.id}">
                    <option value="low" ${task.priority === "low" ? "selected" : ""}>Low</option>
                    <option value="medium" ${task.priority === "medium" ? "selected" : ""}>Medium</option>
                    <option value="high" ${task.priority === "high" ? "selected" : ""}>High</option>
                  </select>`
                    : `<span class="task-title" style="color: #333" data-testid="test-task-title-${task.id}">${escapeHtml(task.title)}</span>
                  <span class="priority-badge priority-${task.priority}" data-testid="test-task-priority-${task.id}">${task.priority}</span>`
                }
            </div>
            <div class="task-meta ${isExpanded ? "" : "collapsed"}">
                ${
                  isEditing
                    ? `<div class="edit-fields">
                    <input type="datetime-local" class="edit-due-date" data-testid="test-edit-due-date-${task.id}" data-task-id="${task.id}" value="${new Date(task.dueDate).toISOString().slice(0, 16)}">
                  </div>`
                    : `<span data-testid="test-task-due-date-${task.id}">📅 ${formatDueDate(task.dueDate)}</span>
                  <span class="status-indicator ${timeStatus.class}" data-testid="test-task-status-${task.id}">${timeStatus.text}</span>`
                }
            </div>
        </div>
        <div class="task-actions">
            ${
              isEditing
                ? `<button class="button-save" onclick="saveEdit(${task.id})" data-testid="test-save-button-${task.id}">💾</button>
               <button class="button-cancel" onclick="cancelEdit()" data-testid="test-cancel-button-${task.id}">❌</button>`
                : `<button class="button-edit" onclick="startEdit(${task.id})" data-testid="test-edit-button-${task.id}">✏️</button>`
            }
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

function formatDueDate(dueDate) {
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due - now;
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffTime < 0) {
    // Overdue
    const overdueMinutes = Math.abs(diffMinutes);
    const overdueHours = Math.abs(diffHours);
    const overdueDays = Math.abs(diffDays);

    if (overdueMinutes < 60) {
      return overdueMinutes === 1
        ? "Overdue by 1 minute"
        : `Overdue by ${overdueMinutes} minutes`;
    } else if (overdueHours < 24) {
      return overdueHours === 1
        ? "Overdue by 1 hour"
        : `Overdue by ${overdueHours} hours`;
    } else {
      return overdueDays === 1
        ? "Overdue by 1 day"
        : `Overdue by ${overdueDays} days`;
    }
  } else {
    // Not overdue
    if (diffMinutes < 60) {
      // Due in less than 1 hour
      return diffMinutes <= 1
        ? "Due in 1 minute"
        : `Due in ${diffMinutes} minutes`;
    } else if (diffHours < 24) {
      // Due in less than 24 hours
      return diffHours === 1 ? "Due in 1 hour" : `Due in ${diffHours} hours`;
    } else if (diffDays === 1) {
      // Due tomorrow
      return "Due tomorrow";
    } else if (diffDays <= 7) {
      // Due in 2-7 days
      return `Due in ${diffDays} days`;
    } else {
      // Due in more than a week, show actual date
      return `Due ${due.toLocaleString([], { month: "short", day: "numeric", year: "numeric" })}`;
    }
  }
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

// Edit functions
function startEdit(id) {
  editingTaskId = id;
  renderTasks();
}

function saveEdit(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    const titleInput = document.querySelector(
      `.edit-title-input[data-task-id="${id}"]`,
    );
    const dueDateInput = document.querySelector(
      `.edit-due-date[data-task-id="${id}"]`,
    );
    const priorityInput = document.querySelector(
      `.edit-priority[data-task-id="${id}"]`,
    );

    if (titleInput && dueDateInput && priorityInput) {
      task.title = titleInput.value.trim();
      task.dueDate = dueDateInput.value;
      task.priority = priorityInput.value;
    }
  }
  editingTaskId = null;
  renderTasks();
}

function cancelEdit() {
  editingTaskId = null;
  renderTasks();
}

function toggleExpand(id) {
  if (expandedTasks.has(id)) {
    expandedTasks.delete(id);
  } else {
    expandedTasks.add(id);
  }
  renderTasks();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function startTimer() {
  setInterval(renderTasks, 60000); // Refresh UI every minute for "Overdue" status
}
