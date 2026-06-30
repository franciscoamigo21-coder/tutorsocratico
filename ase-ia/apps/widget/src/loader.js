/**
 * ASE-IA · Loader del widget embebible.
 *
 * Incrustar en cualquier sitio institucional con UNA línea:
 *   <script src="https://.../ase-ia/loader.js"
 *           data-api="https://api.ase-ia"
 *           data-embed="https://.../ase-ia/embed.html"></script>
 *
 * Inyecta un botón flotante (paleta azul) que abre/cierra un iframe con el
 * chat. El iframe aísla los estilos del sitio anfitrión. En móvil ocupa la
 * pantalla completa; en escritorio es una tarjeta anclada abajo a la derecha.
 */
(function () {
  var current =
    document.currentScript ||
    (function () {
      var s = document.getElementsByTagName("script");
      return s[s.length - 1];
    })();

  var API = (current && current.getAttribute("data-api")) || "http://localhost:4000";
  var EMBED = (current && current.getAttribute("data-embed")) || "./embed.html";
  var BLUE = "#1b3a66";
  var isMobile = function () { return window.matchMedia("(max-width: 640px)").matches; };

  var AVATAR =
    '<svg width="26" height="26" viewBox="0 0 48 48" aria-hidden="true">' +
    '<rect width="48" height="48" rx="12" fill="#15315a"/>' +
    '<line x1="24" y1="9" x2="24" y2="14" stroke="#4fc3f7" stroke-width="2"/>' +
    '<circle cx="24" cy="8" r="2" fill="#4fc3f7"/>' +
    '<rect x="12" y="15" width="24" height="18" rx="6" fill="#fff"/>' +
    '<circle cx="19" cy="24" r="2.6" fill="#1b3a66"/><circle cx="29" cy="24" r="2.6" fill="#1b3a66"/>' +
    '<path d="M19 29 q5 3 10 0" stroke="#4fc3f7" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>';

  // Botón flotante
  var btn = document.createElement("button");
  btn.setAttribute("aria-label", "Abrir ASE-IA");
  btn.innerHTML = AVATAR + '<span style="margin-left:8px">ASE-IA</span>';
  btn.style.cssText =
    "position:fixed;bottom:20px;right:20px;z-index:2147483000;display:flex;" +
    "align-items:center;background:" + BLUE + ";color:#fff;border:none;" +
    "border-radius:9999px;padding:12px 18px;font-family:system-ui,sans-serif;" +
    "font-weight:700;font-size:15px;box-shadow:0 6px 20px rgba(0,0,0,.25);cursor:pointer;";

  // iframe
  var frame = document.createElement("iframe");
  frame.title = "ASE-IA";
  frame.src = EMBED + (EMBED.indexOf("?") === -1 ? "?" : "&") + "api=" + encodeURIComponent(API);
  frame.style.display = "none";

  function applyFrameSize() {
    if (isMobile()) {
      frame.style.cssText =
        "position:fixed;inset:0;z-index:2147483000;width:100%;height:100%;" +
        "border:none;background:#fff;display:" + (open ? "block" : "none") + ";";
    } else {
      frame.style.cssText =
        "position:fixed;bottom:84px;right:20px;z-index:2147483000;width:380px;" +
        "max-width:92vw;height:600px;max-height:80vh;border:none;border-radius:16px;" +
        "box-shadow:0 12px 40px rgba(0,0,0,.30);background:#fff;display:" +
        (open ? "block" : "none") + ";";
    }
  }

  function positionButton() {
    // En móvil con el panel abierto, el botón va arriba a la derecha para no
    // tapar el campo de escritura del iframe a pantalla completa.
    if (open && isMobile()) {
      btn.style.top = "12px";
      btn.style.bottom = "auto";
    } else {
      btn.style.top = "auto";
      btn.style.bottom = "20px";
    }
  }

  var open = false;
  function toggle(force) {
    open = typeof force === "boolean" ? force : !open;
    applyFrameSize();
    positionButton();
    // El botón permanece visible siempre (también sobre el iframe a pantalla
    // completa en móvil) para poder cerrar.
    btn.querySelector("span").textContent = open ? "Cerrar" : "ASE-IA";
    btn.setAttribute("aria-label", open ? "Cerrar ASE-IA" : "Abrir ASE-IA");
  }

  btn.addEventListener("click", function () { toggle(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) toggle(false); });
  window.addEventListener("resize", function () { if (open) { applyFrameSize(); positionButton(); } });

  document.body.appendChild(frame);
  document.body.appendChild(btn);
  applyFrameSize();
})();
