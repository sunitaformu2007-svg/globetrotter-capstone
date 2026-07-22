/* Renders the top nav into #site-nav on every page, based on auth state. */

function renderNav(activePage) {
  const mount = document.getElementById("site-nav");
  if (!mount) return;

  const user = Auth.getUser();
  const loggedIn = Auth.isLoggedIn();

  const link = (href, label, key) =>
    `<a href="${href}" class="${activePage === key ? "active" : ""}">${label}</a>`;

  const links = loggedIn
    ? [
        link("dashboard.html", "Dashboard", "dashboard"),
        link("destinations.html", "Destinations", "destinations"),
        link("itineraries.html", "My Itineraries", "itineraries"),
      ]
    : [link("index.html#how-it-works", "How it works", ""), link("destinations.html", "Destinations", "destinations")];

  const actions = loggedIn
    ? `<span class="nav-user">${escapeHtml(user?.name || "")}</span>
       <button class="btn btn-ghost btn-sm" id="nav-logout">Sign out</button>`
    : `<a href="login.html" class="btn btn-ghost btn-sm">Sign in</a>
       <a href="register.html" class="btn btn-primary btn-sm">Get started</a>`;

  mount.innerHTML = `
    <nav class="site-nav">
      <div class="container">
        <a href="${loggedIn ? "dashboard.html" : "index.html"}" class="brand">
          <span class="mark">GT</span> GlobeTrotter
        </a>
        <ul class="nav-links">${links.map((l) => `<li>${l}</li>`).join("")}</ul>
        <div class="nav-actions">${actions}</div>
      </div>
    </nav>`;

  const logoutBtn = document.getElementById("nav-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      Auth.clear();
      window.location.href = "index.html";
    });
  }
}
