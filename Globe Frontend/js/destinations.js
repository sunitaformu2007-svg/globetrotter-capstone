/* Destinations page: search, category chips, budget filter, detail modal. */

renderNav("destinations");

const params = new URLSearchParams(window.location.search);
let state = {
  search: params.get("search") || "",
  category: "all",
  max_cost: "",
};

const grid = document.getElementById("dest-grid");
const resultCount = document.getElementById("result-count");
const searchInput = document.getElementById("search-input");
const chipRow = document.getElementById("category-chips");
const maxCostSelect = document.getElementById("max-cost");

searchInput.value = state.search;

function cardHtml(d) {
  return `
    <article class="pass-card" data-id="${d.id}">
      <div class="pass-main">
        <img class="pass-photo" src="${destPhotoUrl(d)}" alt="${escapeHtml(d.name)}" loading="lazy" />
        <h3 class="pass-dest">${escapeHtml(d.name)}</h3>
        <span class="pass-country">${escapeHtml(d.country)}</span>
        <p class="pass-desc">${escapeHtml(d.description)}</p>
        <div class="pass-meta"><span><strong>$${d.avg_cost_usd}</strong>/day avg</span><span>${escapeHtml(d.best_season)}</span></div>
        <div class="pass-actions">
          <button class="btn btn-ghost btn-sm view-btn" data-id="${d.id}">Details</button>
          <button class="btn btn-primary btn-sm plan-btn" data-id="${d.id}" data-name="${escapeHtml(d.name)}">Plan trip</button>
        </div>
      </div>
      <div class="pass-stub">
        <div class="stamp-badge"><span class="rating">${d.rating}</span><span class="rating-label">RATING</span></div>
        <span class="pass-category">${escapeHtml(d.category)}</span>
      </div>
    </article>`;
}

async function loadCategories(active) {
  try {
    const data = await Api.searchDestinations();
    const cats = ["all", ...data.categories];
    chipRow.innerHTML = cats
      .map((c) => `<button class="chip ${c === active ? "active" : ""}" data-cat="${c}">${c}</button>`)
      .join("");
    chipRow.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        state.category = chip.dataset.cat;
        chipRow.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        runSearch();
      });
    });
  } catch (err) {
    chipRow.innerHTML = "";
  }
}

async function runSearch() {
  resultCount.textContent = "Searching…";
  try {
    const data = await Api.searchDestinations({
      search: state.search,
      category: state.category,
      max_cost: state.max_cost,
    });
    resultCount.textContent = `${data.count} destination${data.count === 1 ? "" : "s"} found`;
    grid.innerHTML = data.results.length
      ? data.results.map(cardHtml).join("")
      : `<div class="empty-state"><h3>No matches</h3><p>Try a different search term, category or budget.</p></div>`;
    attachCardHandlers();

    const deepLinkId = params.get("dest");
    if (deepLinkId) {
      openDetail(Number(deepLinkId));
      params.delete("dest");
    }
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><h3>Couldn't load destinations</h3><p>${escapeHtml(err.message)}</p></div>`;
    resultCount.textContent = "";
  }
}

function attachCardHandlers() {
  grid.querySelectorAll(".view-btn").forEach((btn) =>
    btn.addEventListener("click", () => openDetail(Number(btn.dataset.id)))
  );
  grid.querySelectorAll(".plan-btn").forEach((btn) =>
    btn.addEventListener("click", () => goPlan(Number(btn.dataset.id), btn.dataset.name))
  );
}

function goPlan(id, name) {
  if (!Auth.isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }
  window.location.href = `itineraries.html?plan=${id}&name=${encodeURIComponent(name)}`;
}

const overlay = document.getElementById("detail-overlay");
const modal = document.getElementById("detail-modal");

async function openDetail(id) {
  modal.innerHTML = `<div class="skeleton" style="height:220px"></div>`;
  overlay.classList.add("open");
  try {
    const d = await Api.getDestination(id);
    modal.innerHTML = `
      <div class="modal-head">
        <h2 style="margin:0;">${escapeHtml(d.name)}</h2>
        <button class="modal-close" id="modal-close">&times;</button>
      </div>
      <img class="pass-photo" style="height:200px;border-radius:8px;" src="${destPhotoUrl(d, 640, 340)}" alt="${escapeHtml(d.name)}" />
      <p class="muted" style="margin-top:14px;">${escapeHtml(d.country)} · ${escapeHtml(d.category)} · Best season: ${escapeHtml(d.best_season)}</p>
      <p>${escapeHtml(d.description)}</p>
      <div class="chip-row">${d.tags.map((t) => `<span class="chip">${escapeHtml(t)}</span>`).join("")}</div>
      <div class="pass-meta mt-24"><span><strong>$${d.avg_cost_usd}</strong>/day avg</span><span>Rated ${d.rating}/5</span></div>
      <button class="btn btn-primary btn-block mt-24" id="modal-plan-btn">Plan a trip to ${escapeHtml(d.name)}</button>
    `;
    document.getElementById("modal-close").addEventListener("click", closeDetail);
    document.getElementById("modal-plan-btn").addEventListener("click", () => goPlan(d.id, d.name));
  } catch (err) {
    modal.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
  }
}

function closeDetail() {
  overlay.classList.remove("open");
}
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeDetail(); });

document.getElementById("search-btn").addEventListener("click", () => {
  state.search = searchInput.value.trim();
  runSearch();
});
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { state.search = searchInput.value.trim(); runSearch(); }
});
maxCostSelect.addEventListener("change", () => {
  state.max_cost = maxCostSelect.value;
  runSearch();
});

loadCategories("all");
runSearch();
