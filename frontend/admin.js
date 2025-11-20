// Базовый URL твоего API
const API_BASE_URL = 'http://localhost:3000';

// Элементы формы
const lawForm = document.getElementById('law-form');
const lawId = document.getElementById('law-id');
const lawCountry = document.getElementById('law-country');
const lawTitle = document.getElementById('law-title');
const lawSummary = document.getElementById('law-summary');
const lawFullText = document.getElementById('law-full-text');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formTitle = document.getElementById('form-title');

// Список
const resultsDiv = document.getElementById('admin-results');
const resultsEmpty = document.getElementById('admin-results-empty');

let editMode = false;

// Небольшой helper, чтобы не словить XSS при вставке строк в innerHTML
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// --- Получить и отобразить все законы ---
async function loadLaws() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/laws`);
    if (!res.ok) {
      throw new Error('Ошибка загрузки законов');
    }
    const laws = await res.json();
    renderLaws(laws);
  } catch (err) {
    console.error(err);
    resultsDiv.innerHTML = '<div style="color:red;">Не удалось загрузить законы</div>';
    resultsEmpty.style.display = 'none';
  }
}

// --- Отрисовка списка ---
function renderLaws(laws) {
  resultsDiv.innerHTML = '';

  if (!laws || laws.length === 0) {
    resultsEmpty.style.display = 'block';
    return;
  }

  resultsEmpty.style.display = 'none';

  laws.forEach((law) => {
    const div = document.createElement('div');
    div.className = 'law-item';

    div.innerHTML = `
      <div class="law-header">
        <span class="law-title">${escapeHtml(law.title)}</span>
        <span class="law-country">${escapeHtml(law.country)}</span>
      </div>
      <div class="law-summary">${escapeHtml(law.summary)}</div>
      <div class="law-actions">
        <button class="edit-btn" data-id="${law.id}">Редактировать</button>
        <button class="delete-btn" data-id="${law.id}">Удалить</button>
      </div>
    `;

    resultsDiv.appendChild(div);
  });

  // Навешиваем обработчики
  document.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      editLaw(id);
    });
  });

  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (confirm('Удалить этот закон?')) {
        deleteLaw(id);
      }
    });
  });
}

// --- Сабмит формы: добавить или обновить закон ---
lawForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const law = {
    country: lawCountry.value.trim(),
    title: lawTitle.value.trim(),
    summary: lawSummary.value.trim(),
    full_text: lawFullText.value.trim(),
  };

  try {
    if (editMode && lawId.value) {
      // Обновление
      await fetch(`${API_BASE_URL}/api/laws/${lawId.value}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(law),
      });
    } else {
      // Добавление
      await fetch(`${API_BASE_URL}/api/laws`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(law),
      });
    }

    resetForm();
    await loadLaws();
  } catch (err) {
    console.error(err);
    alert('Ошибка при сохранении закона');
  }
});

// --- Редактировать закон ---
async function editLaw(id) {
  try {
    // Используем тот же эндпоинт, что и раньше, получая все законы и находя нужный
    const res = await fetch(`${API_BASE_URL}/api/laws`);
    if (!res.ok) {
      throw new Error('Ошибка загрузки законов');
    }
    const laws = await res.json();
    const law = laws.find((x) => String(x.id) === String(id));

    if (!law) {
      alert('Закон не найден');
      return;
    }

    lawId.value = law.id;
    lawCountry.value = law.country || '';
    lawTitle.value = law.title || '';
    lawSummary.value = law.summary || '';
    lawFullText.value = law.full_text || '';

    editMode = true;
    cancelBtn.style.display = 'inline-block';
    saveBtn.textContent = 'Обновить закон';
    formTitle.textContent = 'Редактирование закона';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    console.error(err);
    alert('Ошибка при загрузке закона для редактирования');
  }
}

// --- Удалить закон ---
async function deleteLaw(id) {
  try {
    await fetch(`${API_BASE_URL}/api/laws/${id}`, {
      method: 'DELETE',
    });
    await loadLaws();
  } catch (err) {
    console.error(err);
    alert('Ошибка при удалении закона');
  }
}

// --- Сброс формы в режим "Добавить" ---
function resetForm() {
  lawId.value = '';
  lawCountry.value = '';
  lawTitle.value = '';
  lawSummary.value = '';
  lawFullText.value = '';
  editMode = false;
  cancelBtn.style.display = 'none';
  saveBtn.textContent = 'Сохранить закон';
  formTitle.textContent = 'Добавить закон';
}

// Кнопка "Отмена"
cancelBtn.addEventListener('click', () => {
  resetForm();
});

// Первичная загрузка
window.addEventListener('DOMContentLoaded', () => {
  loadLaws();
});
