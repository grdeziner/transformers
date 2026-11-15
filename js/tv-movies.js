/* TV & Movies catalog — rendered from data/tv-movies.json, with the HTML list as a no-JS fallback */
(() => {
  const catalog = document.querySelector("#catalog");
  const buttons = [...document.querySelectorAll("[data-filter]")];
  const count = document.querySelector("[data-catalog-count]");
  if (!catalog || !buttons.length) return;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);

  let items = [];
  let filter = "all";

  const grouped = (list) => {
    const shown = list.filter((item) => filter === "all" || item.type === filter);
    const map = new Map();
    shown.forEach((item) => {
      if (!map.has(item.decade)) map.set(item.decade, []);
      map.get(item.decade).push(item);
    });
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  };

  const markup = (list) => {
    const groups = grouped(list);
    if (!groups.length) return '<p class="catalog__empty">Nothing in this reel yet.</p>';
    return groups.map(([decade, rows]) => `
      <section class="decade">
        <h2 class="decade__title">${esc(decade)}s</h2>
        <ol class="decade__list">
          ${rows.map((row) => `
            <li class="show" data-type="${esc(row.type)}">
              <h3 class="show__title">${esc(row.title)}</h3>
              <p class="show__meta"><span class="show__type">${esc(row.type)}</span><span class="show__years">${esc(row.years)}</span></p>
              <p class="show__studio">${esc(row.studio)} · ${esc(row.network)}</p>
              <p class="show__desc">${esc(row.summary)}</p>
            </li>`).join("")}
        </ol>
      </section>`).join("");
  };

  const paint = () => {
    catalog.innerHTML = markup(items);
    if (count) {
      const n = items.filter((item) => filter === "all" || item.type === filter).length;
      const noun = filter === "Movie" ? "movies" : filter === "TV series" ? "series" : "shows and films";
      count.textContent = `${n} ${noun}`;
    }
  };

  const bind = (handler) => {
    buttons.forEach((btn) => btn.addEventListener("click", () => {
      filter = btn.dataset.filter;
      buttons.forEach((b) => {
        const on = b === btn;
        b.setAttribute("aria-pressed", on ? "true" : "false");
        b.classList.toggle("is-on", on);
      });
      handler();
    }));
  };

  const filterDom = () => {
    catalog.querySelectorAll(".show").forEach((el) => {
      el.hidden = filter !== "all" && el.dataset.type !== filter;
    });
    catalog.querySelectorAll(".decade").forEach((sec) => {
      sec.hidden = ![...sec.querySelectorAll(".show")].some((el) => !el.hidden);
    });
  };

  fetch("data/tv-movies.json")
    .then((res) => { if (!res.ok) throw new Error(String(res.status)); return res.json(); })
    .then((data) => {
      items = [...data].sort((a, b) => b.decade - a.decade || String(b.premiere).localeCompare(String(a.premiere)));
      bind(paint);
      paint();
    })
    .catch(() => bind(filterDom));
})();
