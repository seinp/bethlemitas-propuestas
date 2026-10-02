// Motor compartido de las 6 propuestas: recarga al principio, intro, entradas al llegar,
// contadores, menú del teléfono, cabecera al bajar y la cinta de "contenido de muestra".
(() => {
  const raiz = document.documentElement;
  raiz.classList.add("js");
  if (window.self !== window.top) raiz.classList.add("en-marco");

  // Al recargar, siempre desde arriba: sin restaurar scroll ni ancla.
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  window.scrollTo(0, 0);

  const reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cuerpo = document.body;

  // ---------- Años desde la fundación (8 de octubre de 1888) ----------
  const hoy = new Date();
  const cumplio = hoy.getMonth() > 9 || (hoy.getMonth() === 9 && hoy.getDate() >= 8);
  const anios = hoy.getFullYear() - 1888 - (cumplio ? 0 : 1);
  document.querySelectorAll('[data-cuenta="anios"]').forEach(el => { el.dataset.cuenta = anios; });
  document.querySelectorAll("[data-anios]").forEach(el => { el.textContent = anios; });

  // ---------- Contadores ----------
  const contar = el => {
    if (el._contado) return;
    el._contado = true;
    const meta = Number(el.dataset.cuenta);
    const desde = Number(el.dataset.desde || 0);
    if (reducido) { el.textContent = meta; return; }
    const dur = Number(el.dataset.dur || 1500);
    const t0 = performance.now();
    const vuelta = ++el._vuelta || (el._vuelta = 1);
    const paso = t => {
      if (el._vuelta !== vuelta) return;
      const p = Math.min(1, (t - t0) / dur);
      const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = Math.round(desde + (meta - desde) * e);
      if (p < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
    // Red de seguridad si el navegador frena rAF (pestaña oculta o marco).
    el._seguro = setTimeout(() => { if (el._vuelta === vuelta) el.textContent = meta; }, dur + 400);
  };
  const reiniciarContador = el => {
    clearTimeout(el._seguro);
    el._vuelta = (el._vuelta || 0) + 1;
    el._contado = false;
    el.textContent = el.dataset.desde || 0;
  };

  // ---------- Entradas al llegar (se reinician al salir) ----------
  const entradas = [...document.querySelectorAll("[data-entra]")];
  const cuentas = [...document.querySelectorAll("[data-cuenta]")];
  cuentas.forEach(reiniciarContador);

  const vigilar = () => {
    if (reducido || !("IntersectionObserver" in window)) {
      entradas.forEach(el => el.classList.add("animar"));
      cuentas.forEach(contar);
      return;
    }
    const io = new IntersectionObserver(lista => {
      lista.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          target.classList.add("animar");
          if (target.dataset.cuenta !== undefined) contar(target);
          target.querySelectorAll?.("[data-cuenta]").forEach(contar);
        } else {
          target.classList.remove("animar");
          if (target.dataset.cuenta !== undefined) reiniciarContador(target);
        }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0 });
    entradas.forEach(el => io.observe(el));
    cuentas.forEach(el => io.observe(el));
  };

  // ---------- Intro dentro del mundo (~2 s, se salta con clic o Esc) ----------
  const intro = document.getElementById("intro");
  let arranco = false;
  const arrancar = () => {
    if (arranco) return;
    arranco = true;
    cuerpo.classList.add("listo");
    window.dispatchEvent(new Event("intro-fin"));
    vigilar();
  };
  if (intro && !reducido) {
    cuerpo.classList.add("con-intro");
    const cerrar = () => {
      if (intro.classList.contains("fuera")) return;
      intro.classList.add("fuera");
      cuerpo.classList.remove("con-intro");
      setTimeout(arrancar, Number(intro.dataset.salida || 350));
      setTimeout(() => intro.remove(), 1400);
    };
    setTimeout(cerrar, Number(intro.dataset.ms || 2000));
    intro.addEventListener("click", cerrar);
    addEventListener("keydown", e => { if (e.key === "Escape") cerrar(); });
  } else {
    intro?.remove();
    arrancar();
  }

  // ---------- Cabecera al bajar ----------
  const marcarScroll = () => cuerpo.classList.toggle("bajo", window.scrollY > 40);
  addEventListener("scroll", marcarScroll, { passive: true });
  marcarScroll();

  // ---------- Menú del teléfono (cambia a X, bloquea el fondo, se cierra al tocar afuera) ----------
  const botonesMenu = [...document.querySelectorAll("[data-menu]")];
  const marcarMenu = abierto => {
    cuerpo.classList.toggle("menu-abierto", abierto);
    raiz.classList.toggle("menu-bloqueo", abierto);
    botonesMenu.forEach(b => {
      b.setAttribute("aria-expanded", abierto);
      b.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
      b.querySelector("use")?.setAttribute("href", "iconos.svg#" + (abierto ? "i-cerrar" : "i-menu"));
    });
  };
  botonesMenu.forEach(btn => btn.addEventListener("click", e => {
    e.stopPropagation();
    marcarMenu(!cuerpo.classList.contains("menu-abierto"));
  }));
  document.querySelectorAll(".menu a, [data-cierra-menu]").forEach(a => a.addEventListener("click", () => marcarMenu(false)));
  document.addEventListener("click", e => {
    if (cuerpo.classList.contains("menu-abierto") && !e.target.closest(".menu")) marcarMenu(false);
  });
  addEventListener("keydown", e => { if (e.key === "Escape" && cuerpo.classList.contains("menu-abierto")) marcarMenu(false); });

  // ---------- Enlaces a páginas internas que todavía no existen ----------
  let avisoMuestra, avisoTimer;
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href="#"]');
    if (!a) return;
    e.preventDefault();
    if (!avisoMuestra) {
      avisoMuestra = document.createElement("div");
      avisoMuestra.className = "aviso-muestra";
      avisoMuestra.setAttribute("role", "status");
      avisoMuestra.textContent = "Página interna de muestra: se diseña en la siguiente etapa.";
      cuerpo.appendChild(avisoMuestra);
    }
    avisoMuestra.classList.add("ver");
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => avisoMuestra.classList.remove("ver"), 2600);
  });

  // ---------- Pestañas simples (data-pestanas > [data-pestana] + [data-panel]) ----------
  document.querySelectorAll("[data-pestanas]").forEach(grupo => {
    const botones = grupo.querySelectorAll("[data-pestana]");
    const paneles = grupo.querySelectorAll("[data-panel]");
    botones.forEach(b => b.addEventListener("click", () => {
      botones.forEach(x => x.setAttribute("aria-selected", x === b));
      paneles.forEach(p => {
        const ver = p.dataset.panel === b.dataset.pestana || b.dataset.pestana === "todo";
        p.hidden = !ver;
        if (ver) { p.classList.remove("animar"); void p.offsetWidth; p.classList.add("animar"); }
      });
    }));
  });

  // ---------- Cinta de muestra ----------
  const n = cuerpo.dataset.propuesta;
  if (n) {
    const a = document.createElement("a");
    a.className = "cinta";
    a.href = "index.html";
    a.innerHTML = `<b>${n} / 6</b><span><span class="largo">${cuerpo.dataset.nombre || ""} · Contenido de muestra · Ver las 6</span><span class="corto">Muestra · Ver las 6</span></span>`;
    cuerpo.appendChild(a);
  }
})();
