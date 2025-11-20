const API_BASE_URL = 'http://localhost:3000';

const lawForm = document.getElementById('law-form');
const lawId = document.getElementById('law-id');
const lawCountry = document.getElementById('law-country');
const lawTitle = document.getElementById('law-title');
const lawSummary = document.getElementById('law-summary');
const lawFullText = document.getElementById('law-full-text');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const resultsDiv = document.getElementById('admin-results');

let editMode = false;

// --- Получить и отобразить все законы ---
async function loadLaws() {
  const res = await fetch(`${API_BASE_URL}/api/laws`);
  const laws = await res.json();
  console.log(laws);

  renderLaws(laws);
}

// --- Отрисовка списка ---
function renderLaws(laws) {
  resultsDiv.innerHTML = '';
  laws.forEach(law => {
    const div = document.createElement('div');
    div.className = 'law-item';
    div.innerHTML = `
      <b>${law.title}</b> | <i>${law.country}</i>
      <button data-id="${law.id}" class="edit-btn">Редактировать</button>
      <button data-id="${law.id}" class="delete-btn">Удалить</button>
      <br><small>${law.summary}</small>
    `;
    resultsDiv.appendChild(div);
  });

  document.querySelectorAll('.delete-btn').forEach(btn =>
    btn.onclick = () => deleteLaw(btn.dataset.id)
  );
  document.querySelectorAll('.edit-btn').forEach(btn =>
    btn.onclick = () => editLaw(btn.dataset.id)
  );
}

// --- Добавить или обновить закон ---
lawForm.onsubmit = async (e) => {
  e.preventDefault();
  const law = {
    country: lawCountry.value,
    title: lawTitle.value,
    summary: lawSummary.value,
    full_text: lawFullText.value
  };

  if (editMode) {
    // Обновление
    await fetch(`${API_BASE_URL}/api/laws/${lawId.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(law)
    });
  } else {
    // Добавление
    await fetch(`${API_BASE_URL}/api/laws`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(law)
    });
  }
  resetForm();
  loadLaws();
};

function editLaw(id) {
  fetch(`${API_BASE_URL}/api/laws`)
    .then(res => res.json())
    .then(laws => {
      const law = laws.find(x => x.id == id);
      lawId.value = law.id;
      lawCountry.value = law.country;
      lawTitle.value = law.title;
      lawSummary.value = law.summary;
      lawFullText.value = law.full_text;
      editMode = true;
      cancelBtn.style.display = '';
      saveBtn.textContent = 'Обновить';
    });
}

cancelBtn.onclick = function () {
  resetForm();
};

function resetForm() {
  lawId.value = '';
  lawCountry.value = '';
  lawTitle.value = '';
  lawSummary.value = '';
  lawFullText.value = '';
  editMode = false;
  cancelBtn.style.display = 'none';
  saveBtn.textContent = 'Сохранить';
}

// --- Удалить закон ---
async function deleteLaw(id) {
    console.log(id);
  await fetch(`${API_BASE_URL}/api/laws/${id}`, { method: 'DELETE' });

  loadLaws();
}

loadLaws();


// Обработчик для формы регистрации
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

  const response = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const result = await response.json();
  alert(result.message); // Показать сообщение от сервера
});

// Обработчик для формы подтверждения
document.getElementById('verify-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('verify-email').value;
  const code = document.getElementById('verify-code').value;

  const response = await fetch('/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });

  const result = await response.json();
  alert(result.message);
});

// Обработчик для формы входа
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (response.ok) {
    const { token } = await response.json();
    localStorage.setItem('authToken', token); // Сохраняем токен
    alert('[translate:Вход выполнен успешно! Токен сохранен.]');
    // Здесь можно перенаправить пользователя на защищенную страницу
  } else {
    const result = await response.json();
    alert('[translate:Ошибка входа: ]' + result.message);
  }
});
