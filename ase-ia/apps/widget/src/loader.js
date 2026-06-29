/**
 * ASE-IA · Loader del widget embebible.
 *
 * Uso en cualquier sitio institucional (una sola línea):
 *   <script src="https://.../ase-ia/loader.js" data-api="https://api.ase-ia"></script>
 *
 * Inyecta un botón flotante (paleta azul) que abre/cierra un iframe con el
 * chat. El iframe aísla estilos del sitio anfitrión (no contamina su CSS).
 */
(function () {
  var current = document.currentScript || (function () {
    var s = document.getElementsByTagName("script");
    return s[s.length - 1];
  })();

  var API = (current && current.getAttribute("data-api")) || "http://localhost:4000";
  var EMBED = (current && current.getAttribute("data-embed")) || "./embed.html";

  var BLUE = "#1b3a66";

  // Botón flotante
  var btn = document.createElement("button");
  btn.setAttribute("aria-label", "Abrir ASE-IA");
  btn.textContent = "ASE-IA";
  btn.style.cssText =
    "position:fixed;bottom:20px;right:20px;z-index:2147483000;" +
    "background:" + BLUE + ";color:#fff;border:none;border-radius:9999px;" +
    "padding:14px 18px;font-family:system-ui,sans-serif;font-weight:700;" +
    "box-shadow:0 6px 20px rgba(0,0,0,.25);cursor:pointer;";

  // Contenedor del iframe
  var frame = document.createElement("iframe");
  frame.title = "ASE-IA";
  frame.src = EMBED + (EMBED.indexOf("?") === -1 ? "?" : "&") + "api=" + encodeURIComponent(API);
  frame.style.cssText =
    "position:fixed;bottom:84px;right:20px;z-index:2147483000;width:360px;" +
    "max-width:92vw;height:520px;max-height:75vh;border:none;border-radius:16px;" +
    "box-shadow:0 12px 40px rgba(0,0,0,.30);display:none;background:#fff;";

  var open = false;
  btn.addEventListener("click", function () {
    open = !open;
    frame.style.display = open ? "block" : "none";
    btn.textContent = open ? "Cerrar" : "ASE-IA";
  });

  document.body.appendChild(frame);
  document.body.appendChild(btn);
})();
