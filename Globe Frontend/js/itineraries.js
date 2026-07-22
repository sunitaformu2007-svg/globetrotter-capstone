/* Itineraries page: list, create, edit, delete. */

Auth.requireLogin();
renderNav("itineraries");

const grid = document.getElementById("itin-grid");
const alertBox = document.getElementById("itin-alert");
const overlay = document.getElementById("itin-overlay");
const form = document.getElementById("itin-form");
const modalTitle = document.getElementById("modal-title");
const modalAlert = document.getElementById("modal-alert");
const destinationSelect = document.getElementById("destination");
const saveBtn = document.getElementById("save-btn");

let destinationsCache = [];

function itinCardHtml(it) {
  const dest = it.destination || {};
  return `
    <article class="pass-card itin-card" data-id="${it.id}">
      <div class="pass-main">
        <h3 class="pass-dest">${escapeHtml(it.title)}</h3>
        <span class="itin-route">✈ ${escapeHtml(dest.name || "Unknown")}, ${escapeHtml(dest.country || "")}</span>
        <div class="itin-dates">${formatDate(it.start_date)} → ${formatDate(it.end_date)}</div>
        ${it.notes ? `<p class="pass-desc">${escapeHtml(it.notes)}</p>` : ""}
        <span class="status-pill status-${it.status}">${it.status}</span>
        <div class="pass-actions">
          <button class="btn btn-ghost btn-sm edit-btn" data-id="${it.id}">Edit</button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${it.id}">Delete</button>
        </div>
      </div>
      <div class="pass-stub">
        <img class="pass-photo" style="height:64px;width:64px;border-radius:50%;" src="${destPhotoUrl(dest.id ? dest : { name: it.title })}" alt="" />
      </div>
    </article>`;
}

async function loadItineraries() {
  try {
    const { results } = await Api.listItineraries();
    grid.innerHTML = results.length
      ? results.map(itinCardHtml).join("")
      : `<div class="empty-state"><h3>No trips yet</h3><p>Create your first itinerary to see it here.</p></div>`;
    attachRowHandlers();
  } catch (err) {
    alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
  }
}

function attachRowHandlers() {
  grid.querySelectorAll(".edit-btn").forEach((btn) =>
    btn.addEventListener("click", () => openEdit(Number(btn.dataset.id)))
  );
  grid.querySelectorAll(".delete-btn").forEach((btn) =>
    btn.addEventListener("click", () => confirmDelete(Number(btn.dataset.id)))
  );
}

async function ensureDestinationOptions() {
  if (destinationsCache.length) return;
  const data = await Api.searchDestinations();
  destinationsCache = data.results;
  destinationSelect.innerHTML = destinationsCache
    .map((d) => `<option value="${d.id}">${escapeHtml(d.name)}, ${escapeHtml(d.country)}</option>`)
    .join("");
}

function resetForm() {
  form.reset();
  document.getElementById("itin-id").value = "";
  document.getElementById("status").value = "planned";
  modalAlert.innerHTML = "";
}

async function openCreate(prefillDestId, prefillName) {
  resetForm();
  await ensureDestinationOptions();
  modalTitle.textContent = "New itinerary";
  saveBtn.textContent = "Save itinerary";
  if (prefillDestId) {
    destinationSelect.value = String(prefillDestId);
    document.getElementById("title").value = prefillName ? `Trip to ${prefillName}` : "";
  }
  overlay.classList.add("open");
}

async function openEdit(id) {
  resetForm();
  await ensureDestinationOptions();
  modalTitle.textContent = "Edit itinerary";
  saveBtn.textContent = "Update itinerary";
  try {
    const it = await Api.getItinerary(id);
    document.getElementById("itin-id").value = it.id;
    document.getElementById("title").value = it.title;
    destinationSelect.value = String(it.destination_id);
    document.getElementById("start_date").value = it.start_date;
    document.getElementById("end_date").value = it.end_date;
    document.getElementById("status").value = it.status;
    document.getElementById("notes").value = it.notes || "";
    overlay.classList.add("open");
  } catch (err) {
    showToast(err.message, "error");
  }
}

function closeModal() { overlay.classList.remove("open"); }

document.getElementById("new-itin-btn").addEventListener("click", () => openCreate());
document.getElementById("modal-close").addEventListener("click", closeModal);
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  modalAlert.innerHTML = "";
  const id = document.getElementById("itin-id").value;
  const payload = {
    title: document.getElementById("title").value.trim(),
    destination_id: Number(destinationSelect.value),
    start_date: document.getElementById("start_date").value,
    end_date: document.getElementById("end_date").value,
    status: document.getElementById("status").value,
    notes: document.getElementById("notes").value.trim(),
  };

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";
  try {
    if (id) {
      await Api.updateItinerary(Number(id), payload);
      showToast("Itinerary updated");
    } else {
      await Api.createItinerary(payload);
      showToast("Itinerary created");
    }
    closeModal();
    loadItineraries();
  } catch (err) {
    modalAlert.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = id ? "Update itinerary" : "Save itinerary";
  }
});

async function confirmDelete(id) {
  if (!window.confirm("Delete this itinerary? This can't be undone.")) return;
  try {
    await Api.deleteItinerary(id);
    showToast("Itinerary deleted");
    loadItineraries();
  } catch (err) {
    showToast(err.message, "error");
  }
}

/* Deep link from a "Plan trip" button elsewhere: ?plan=<destId>&name=<name> */
const params = new URLSearchParams(window.location.search);
const planId = params.get("plan");
if (planId) {
  ensureDestinationOptions().then(() => openCreate(Number(planId), params.get("name")));
}

loadItineraries();
