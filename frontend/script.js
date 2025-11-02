// Адрес нашего бэкенда, который мы запустили ранее
const API_BASE_URL = 'http://localhost:3000';

// Находим все нужные нам элементы на HTML-странице
const searchInput = document.getElementById('search-input');
const showAllBtn = document.getElementById('show-all-btn');
const resultsContainer = document.getElementById('results-container');
const lawDetailsContainer = document.getElementById('law-details');

// --- Функции для взаимодействия с API ---

// Функция для поиска законов. "async" означает, что внутри мы будем использовать "await"
async function searchLaws(query) {
    try {
        // "fetch" - это стандартный способ в JavaScript для отправки HTTP-запросов.
        // Мы отправляем запрос на наш бэкенд, на эндпоинт /api/search.
        const response = await fetch(`${API_BASE_URL}/api/search?q=${query}`);
        // "await response.json()" - ждем, пока ответ от сервера будет получен и преобразован в JavaScript-объект
        const data = await response.json();
        // Передаем полученные данные в функцию для отрисовки
        displayResults(data);
    } catch (error) {
        // Если что-то пошло не так (например, бэкенд не запущен)
        console.error('Ошибка при поиске:', error);
        resultsContainer.innerHTML = '<p>Не удалось загрузить данные. Убедитесь, что бэкенд запущен.</p>';
    }
}

// Функция для получения всех законов (аналогично поиску)
async function getAllLaws() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/laws`);
        const data = await response.json();
        displayResults(data);
    } catch (error) {
        console.error('Ошибка при загрузке всех законов:', error);
        resultsContainer.innerHTML = '<p>Не удалось загрузить данные. Убедитесь, что бэкенд запущен.</p>';
    }
}

// --- Функции для отображения данных на странице ---

// Функция для отрисовки списка результатов
function displayResults(laws) {
    resultsContainer.innerHTML = ''; // Очищаем старые результаты
    resultsContainer.classList.remove('hidden'); // Показываем блок с результатами
    lawDetailsContainer.classList.add('hidden'); // Скрываем блок с деталями

    if (laws.length === 0) {
        resultsContainer.innerHTML = '<p>Ничего не найдено.</p>';
        return;
    }

    // Проходимся по каждому закону из полученного массива
    laws.forEach(law => {
        // Создаем новый HTML-элемент <div> для карточки закона
        const lawElement = document.createElement('div');
        lawElement.className = 'law-item';
        // Заполняем его HTML-содержимым, используя данные о законе
        lawElement.innerHTML = `
            <h3>${law.title} (${law.country})</h3>
            <p>${law.summary}</p>
        `;
        // Добавляем обработчик события: при клике на карточку покажем детали этого закона
        lawElement.addEventListener('click', () => displayLawDetails(law));
        // Добавляем созданный элемент на страницу
        resultsContainer.appendChild(lawElement);
    });
}

// Функция для отрисовки полного текста закона
function displayLawDetails(law) {
    resultsContainer.classList.add('hidden'); // Скрываем список результатов
    lawDetailsContainer.classList.remove('hidden'); // Показываем блок с деталями

    lawDetailsContainer.innerHTML = `
        <button id="back-btn">← Назад к списку</button>
        <h2>${law.title}</h2>
        <h4>Страна: ${law.country}</h4>
        <p>${law.full_text}</p>
    `;

    // Сразу же находим кнопку "Назад" и вешаем на нее обработчик клика
    document.getElementById('back-btn').addEventListener('click', getAllLaws);
}

// --- Обработчики событий ---

// Поиск при вводе текста
let searchTimeout;
searchInput.addEventListener('keyup', () => {
    clearTimeout(searchTimeout); // Сбрасываем предыдущий таймер
    // Устанавливаем таймер, чтобы не слать запрос на каждую нажатую букву
    searchTimeout = setTimeout(() => {
        const query = searchInput.value.trim();
        if (query) {
            searchLaws(query);
        } else {
            getAllLaws(); // Если поле очистили, показываем все законы
        }
    }, 300); // Задержка в 300 миллисекунд
});

// Обработчик для кнопки "Показать все"
showAllBtn.addEventListener('click', getAllLaws);

// --- Первоначальная загрузка ---
// Когда страница только открылась, сразу загружаем и показываем все законы
getAllLaws();
