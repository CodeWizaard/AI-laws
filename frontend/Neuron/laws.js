const API_BASE_URL = "http://localhost:3000";

// Обрезает строку до maxLength символов и добавляет …
function truncateText(str, maxLength) {
  if (!str) return "";
  return str.length > maxLength
    ? str.slice(0, maxLength) + "…"
    : str;
}

// загрузка списка законов с сервера
async function loadLawCards() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/laws`);
    if (!res.ok) {
      console.error("Ошибка загрузки законов", res.status);
      return;
    }

    const laws = await res.json();
    renderLawCards(laws);
  } catch (err) {
    console.error("Сетевая ошибка при загрузке законов:", err);
  }
}

// отрисовка карточек в сетку #laws-grid
function renderLawCards(laws) {
  const grid = document.getElementById("laws-grid");
  if (!grid) return;

  grid.innerHTML = "";

  laws.forEach((law, index) => {
    const card = document.createElement("a");
    card.className =
      "law-card" + (index === 0 ? " law-card--featured" : "");
    card.href = `law.html?id=${law.id}`;

    const country = law.country || "Страна не указана";
    const tagInfo = law.date || `ID-${law.id}`;

    // Обрезаем заголовок и описание до 15 символов
    const shortTitle = truncateText(law.title || "Без названия", 35);
    const shortSummary = truncateText(
      law.summary || "Описание закона пока отсутствует.",
      15
    );

    card.innerHTML = `
      <div class="law-card__tags">
        <span class="law-tag">${country}</span>
        <span class="law-tag">${tagInfo}</span>
      </div>

      <h3 class="law-card__title">
        ${shortTitle}
      </h3>

      <p class="law-card__excerpt">
        ${shortSummary}
      </p>

      <div class="law-card__footer"></div>
    `;

    grid.appendChild(card);
  });
}

// защита от HTML из БД
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// запускаем после загрузки DOM
document.addEventListener("DOMContentLoaded", loadLawCards);
