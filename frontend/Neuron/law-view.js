const API_BASE_URL = "http://localhost:3000";

// Берём id из параметра ?id=...
function getLawIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function fetchLaw(id) {
  const res = await fetch(`${API_BASE_URL}/api/laws/${id}`);

  if (res.status === 404) {
    throw new Error("not-found");
  }
  if (!res.ok) {
    throw new Error("server-error");
  }

  return res.json();
}

document.addEventListener("DOMContentLoaded", async () => {
  const id = getLawIdFromUrl();
  const bodyEl = document.getElementById("law-full-text");

  if (!id) {
    bodyEl.textContent = "Не указан идентификатор закона.";
    return;
  }

  try {
    const law = await fetchLaw(id);

    document.getElementById("law-country").textContent = law.country;
    document.getElementById("law-title").textContent = law.title;
    document.getElementById("law-summary").textContent = law.summary;

    // full_text разбиваем на абзацы по пустой строке
    bodyEl.innerHTML = "";
    const blocks = String(law.full_text).split(/\n\s*\n/);

    blocks.forEach(block => {
      const p = document.createElement("p");
      p.textContent = block.trim();
      if (p.textContent.length > 0) {
        bodyEl.appendChild(p);
      }
    });
  } catch (err) {
    if (err.message === "not-found") {
      bodyEl.textContent = "Закон не найден.";
    } else {
      bodyEl.textContent = "Ошибка загрузки закона. Попробуйте позже.";
    }
    console.error(err);
  }
});
