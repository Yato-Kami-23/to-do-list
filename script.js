
const body = document.body;
const theme = document.getElementById('theme');
const addBtn = document.getElementById('addBtn');
const taskInput = document.getElementById('taskInput');
const priority = document.getElementById('priority');
const list = document.getElementById('list');
const tools = [...document.querySelectorAll('.tool')];
const search = document.getElementById('search');
const clearCompleted = document.getElementById('clearCompleted');
const count = document.getElementById('count');
const key = 'todo.tasks.v1';
const dateInput = document.getElementById("dateInput");
const today = new Date().toISOString().split("T")[0];
dateInput.setAttribute("min", today);

let state = {
  tasks: load(),
  filter: 'all',
  q: ''
};

today.textContent = new Date().toLocaleDateString(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric'
});

theme.onclick = () => body.classList.toggle('dark');

addBtn.onclick = () => addTask();

taskInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') addTask();
});

search.addEventListener('input', e => {
  state.q = e.target.value.toLowerCase();
  render();
});

clearCompleted.onclick = () => {
  state.tasks = state.tasks.filter(t => !t.done);
  save();
  render();
};

tools.forEach(t => {
  t.onclick = () => {
    tools.forEach(b => b.removeAttribute('data-active'));
    t.setAttribute('data-active', true);
    state.filter = t.dataset.filter;
    render();
  };
});

function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  state.tasks.push({
    id: Date.now(),
    text,
    done: false,
    date: dateInput.value,
    priority: priority.value
  });

  taskInput.value = '';
  dateInput.value = '';
  priority.value = 'normal';

  save();
  render();
}

function render() {
  list.innerHTML = '';

  let tasks = state.tasks;

  if (state.q) {
    tasks = tasks.filter(t => t.text.toLowerCase().includes(state.q));
  }

  if (state.filter === 'active') {
    tasks = tasks.filter(t => !t.done);
  }

  if (state.filter === 'completed') {
    tasks = tasks.filter(t => t.done);
  }

  for (let task of tasks) {
    list.appendChild(renderTask(task));
  }

  count.textContent = state.tasks.filter(t => !t.done).length;
}

function renderTask(task) {
  const div = document.createElement('div');
  div.className = 'task';
  div.draggable = true;

  if (task.done) div.classList.add('done');
  if (task.priority !== 'normal') div.classList.add(task.priority);

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = task.done;

  cb.onchange = () => {
    task.done = cb.checked;
    save();
    render();
  };

  const span = document.createElement('span');
  span.textContent = task.text;

  span.ondblclick = () => {
    const input = document.createElement('input');
    input.value = task.text;

    input.onblur = () => {
      task.text = input.value.trim() || task.text;
      save();
      render();
    };

    input.onkeypress = e => {
      if (e.key === 'Enter') input.blur();
    };

    div.replaceChild(input, span);
    input.focus();
  };

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = task.date ? `Due: ${task.date}` : '';

  const del = document.createElement('button');
  del.textContent = '✕';

  del.onclick = () => {
    state.tasks = state.tasks.filter(t => t.id !== task.id);
    save();
    render();
  };

  div.appendChild(cb);
  div.appendChild(span);
  div.appendChild(meta);
  div.appendChild(del);

  div.ondragstart = e => {
    e.dataTransfer.setData('id', task.id);
    div.classList.add('dragging');
  };

  div.ondragend = () => {
    div.classList.remove('dragging');
  };

  list.ondragover = e => {
    e.preventDefault();
    const dragging = document.querySelector('.dragging');
    const after = getDragAfter(list, e.clientY);

    if (after == null) {
      list.appendChild(dragging);
    } else {
      list.insertBefore(dragging, after);
    }
  };

  list.ondrop = e => {
    e.preventDefault();
    const id = +e.dataTransfer.getData('id');
    const idx = state.tasks.findIndex(t => t.id === id);
    const dragging = state.tasks.splice(idx, 1)[0];
    const els = [...list.children];
    const newIdx = els.indexOf(document.querySelector('.dragging'));
    state.tasks.splice(newIdx, 0, dragging);
    save();
    render();
  };

  return div;
}

function getDragAfter(container, y) {
  const els = [...container.querySelectorAll('.task:not(.dragging)')];
  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function save() {
  localStorage.setItem(key, JSON.stringify(state.tasks));
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

render();
