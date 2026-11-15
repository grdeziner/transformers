/* Autobot Archive — interactions */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* Art slots: show the real image when present, a cel-style placeholder when not */
  $$("img[data-fallback]").forEach(img => {
    const host = img.closest(".art, .wordmark, .insig");
    const ok = () => host && host.classList.add("has-art");
    const bad = () => host && host.classList.add("missing");
    if (img.complete) (img.naturalWidth ? ok() : bad());
    img.addEventListener("load", ok);
    img.addEventListener("error", bad);
  });

  /* Footer strip uses James's TRANSFORMERS pattern when it's there */
  const strip = $(".footer__strip");
  if (strip) { const t = new Image(); t.onload = () => strip.classList.add("has-art"); t.src = "assets/img/bg-pattern.webp"; }

  /* VCR clock in the header */
  const clock = $("#vcr-clock");
  if (clock) {
    const t0 = Date.now();
    setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      clock.textContent = `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    }, 1000);
  }

  /* Tech Spec cards */
  const specs = {};
  $$(".techspec").forEach(card => {
    const data = JSON.parse(card.dataset.spec);
    const who = card.closest(".bot").id;
    specs[who] = data;
    const list = $(".techspec__bars", card);
    Object.entries(data).forEach(([k, v], r) => {
      const li = document.createElement("li");
      li.className = "ts-row";
      li.innerHTML = `<span class="ts-label">${k}</span><span class="ts-bar" role="img" aria-label="${k} ${v} out of 10">${
        Array.from({ length: 10 }, (_, i) => `<span class="${i < v ? "on" : ""}" style="--i:${i};--r:${r}"></span>`).join("")
      }</span><span class="ts-val">${v}</span>`;
      list.appendChild(li);
    });
    const btn = $(".decoder-btn", card);
    btn.addEventListener("click", () => {
      if (card.classList.contains("decoded")) {
        card.classList.remove("decoded");
        btn.textContent = "Use red decoder";
        return;
      }
      card.classList.add("decoding");
      setTimeout(() => { card.classList.add("decoded"); btn.textContent = "Re-encode"; }, 320);
      setTimeout(() => card.classList.remove("decoding"), 720);
    });
  });

  /* Tale of the tape */
  const table = $(".vs-table");
  if (table && specs.optimus && specs.bumblebee) {
    Object.keys(specs.optimus).forEach(k => {
      const a = specs.optimus[k], b = specs.bumblebee[k];
      const row = document.createElement("div");
      row.className = "vs-row"; row.setAttribute("role", "row");
      row.innerHTML = `
        <span role="cell" class="vs-cell vs-cell--prime ${a > b ? "vs-win" : ""}"><b class="vs-num">${a}</b><span class="vs-track"><span class="vs-fill" style="--v:${a}"></span></span></span>
        <span role="rowheader" class="vs-stat">${k}</span>
        <span role="cell" class="vs-cell ${b > a ? "vs-win" : ""}"><span class="vs-track"><span class="vs-fill" style="--v:${b}"></span></span><b class="vs-num">${b}</b></span>`;
      table.appendChild(row);
    });
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { table.classList.add("in-view"); io.disconnect(); }
    }), { threshold: 0.25 });
    io.observe(table);
  }

  /* Header dropdowns: hover and keyboard on desktop, tap to open on touch */
  const drops = $$("[data-navdrop]");
  const hoverMQ = window.matchMedia("(hover: hover) and (pointer: fine)");
  const hoverCapable = () => hoverMQ.matches;
  let suppressNextFocusOpen = false;
  const setOpen = (drop, open) => {
    drop.classList.toggle("is-open", open);
    const btn = $(".navdrop__toggle", drop);
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
  };
  const closeAll = (except) => drops.forEach(d => { if (d !== except) setOpen(d, false); });

  drops.forEach(drop => {
    const btn = $(".navdrop__toggle", drop);
    let suppressFocusOpen = false;
    let fromPointer = false;
    let pointerOwnsOpen = false;

    btn.addEventListener("pointerdown", () => {
      fromPointer = true;
      if (!hoverCapable()) suppressFocusOpen = true;
    });
    drop.addEventListener("pointerenter", () => {
      if (!hoverCapable()) return;
      pointerOwnsOpen = true;
      closeAll(drop);
      setOpen(drop, true);
    });
    drop.addEventListener("pointerleave", () => {
      if (!hoverCapable() || !pointerOwnsOpen) return;
      const active = document.activeElement;
      if (drop.contains(active) && active !== btn) {
        pointerOwnsOpen = false;
        return;
      }
      pointerOwnsOpen = false;
      setOpen(drop, false);
      if (document.activeElement === btn) btn.blur();
    });
    drop.addEventListener("focusin", () => {
      if (suppressFocusOpen || suppressNextFocusOpen) {
        suppressFocusOpen = false;
        suppressNextFocusOpen = false;
        fromPointer = false;
        return;
      }
      if (!fromPointer) pointerOwnsOpen = false;
      fromPointer = false;
      closeAll(drop);
      setOpen(drop, true);
    });
    drop.addEventListener("focusout", e => {
      if (drop.contains(e.relatedTarget)) return;
      if (pointerOwnsOpen) return;
      setOpen(drop, false);
    });
    btn.addEventListener("click", () => {
      if (hoverCapable()) {
        closeAll(drop);
        setOpen(drop, true);
        return;
      }
      const willOpen = btn.getAttribute("aria-expanded") !== "true";
      closeAll(willOpen ? drop : null);
      setOpen(drop, willOpen);
      suppressFocusOpen = false;
    });
    drop.addEventListener("keydown", e => {
      const links = $$("a[href]", drop);
      if (!links.length || (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End")) return;
      e.preventDefault();
      pointerOwnsOpen = false;
      setOpen(drop, true);
      const i = links.indexOf(document.activeElement);
      if (e.key === "Home") links[0].focus();
      else if (e.key === "End") links[links.length - 1].focus();
      else if (e.key === "ArrowDown") links[(i + 1) % links.length].focus();
      else links[(i <= 0 ? links.length : i) - 1].focus();
    });
    $$("a[href]", drop).forEach(a => a.addEventListener("click", () => {
      pointerOwnsOpen = false;
      setOpen(drop, false);
    }));
  });

  document.addEventListener("pointerdown", e => {
    if (!e.target.closest("[data-navdrop]")) closeAll();
  });
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    const open = drops.find(d => d.classList.contains("is-open"));
    if (!open) return;
    e.preventDefault();
    const btn = $(".navdrop__toggle", open);
    suppressNextFocusOpen = true;
    setOpen(open, false);
    if (btn && document.activeElement !== btn) btn.focus();
    else suppressNextFocusOpen = false;
  });

  /* TRANSFORM! */
  $$("[data-transform]").forEach(stage => {
    const btn = $(".btn--transform", stage);
    const arts = $$(".stage__art", stage);
    const label = $("[data-mode-label]", stage);
    const modes = (btn.dataset.modes || "Robot Mode|Alt Mode").split("|");
    let idx = 0, busy = false;
    btn.addEventListener("click", () => {
      if (busy) return;
      busy = true;
      stage.classList.remove("is-transforming"); void stage.offsetWidth;
      stage.classList.add("is-transforming");
      setTimeout(() => {               // swap while the panels cover the art
        arts[idx].classList.remove("is-active");
        idx = (idx + 1) % arts.length;
        arts[idx].classList.add("is-active");
        label.textContent = modes[idx % modes.length];
      }, 480);
      setTimeout(() => { stage.classList.remove("is-transforming"); busy = false; }, 1150);
    });
  });
})();
