const API_BASE_URL = "http://localhost:3000";

function truncateText(str, maxLength) {
  if (!str) return "";
  return str.length > maxLength ? str.slice(0, maxLength) + "…" : str;
}

async function searchLaws(query) {
  const params = new URLSearchParams();
  if (query && query.trim()) params.set("q", query.trim());

  const res = await fetch(`${API_BASE_URL}/api/search?` + params.toString());
  if (!res.ok) throw new Error("Ошибка поиска");
  return res.json();
}

function renderSearchResults(laws) {
  const grid = document.getElementById("laws-search-results");
  grid.innerHTML = "";

  if (!laws.length) {
    grid.textContent = "Ничего не найдено.";
    return;
  }

  laws.forEach((law) => {
    const card = document.createElement("a");
    card.className = "law-card";
    card.href = `law.html?id=${law.id}`; // страница подробного просмотра

    const shortTitle = truncateText(law.title || "Без названия", 40);
    const shortSummary = truncateText(
      law.summary || "Описание пока отсутствует.",
      80
    );

    card.innerHTML = `
      <div class="law-card__tags">
        <span class="law-tag">${law.country}</span>
        <span class="law-tag">ID-${law.id}</span>
      </div>
      <h3 class="law-card__title">${shortTitle}</h3>
      <p class="law-card__excerpt">${shortSummary}</p>
      <div class="law-card__footer"></div>
    `;
    grid.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("laws-search-form");
  const input = document.getElementById("laws-query");

  // Первый показ — просто все законы
  try {
    const laws = await searchLaws("");
    renderSearchResults(laws);
  } catch (err) {
    console.error(err);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const laws = await searchLaws(input.value);
      renderSearchResults(laws);
    } catch (err) {
      console.error(err);
    }
  });
});
