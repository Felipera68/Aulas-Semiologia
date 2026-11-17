/* Marca d'água só no banner da página inicial (.hero). Edite só este bloco. */
window.MARCA = {
  texto: "Felipe Alberton", // nome da marca
  logo: "",                // opcional: ex. "assets/logo.png" (se preenchido, usa a imagem no lugar do texto)
  opacidade: 0.16,         // 0.08 a 0.30 (o banner é escuro, a marca é clara)
  angulo: -18              // inclinação em graus
};
(function () {
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function fundo() {
    var m = window.MARCA || {};
    var op = m.opacidade == null ? 0.16 : m.opacidade;
    var conteudo = m.logo
      ? "<image href='" + esc(m.logo) + "' x='20' y='50' width='170' height='50' preserveAspectRatio='xMidYMid meet'/>"
      : "<text x='20' y='80' font-family='Arial, sans-serif' font-size='24' font-weight='700' fill='white'>" + esc(m.texto || "") + "</text>";
    var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='300' height='140'>" +
      "<g transform='rotate(" + (m.angulo == null ? -18 : m.angulo) + " 150 70)' opacity='" + op + "'>" + conteudo + "</g></svg>";
    return "url(\"data:image/svg+xml;utf8," + svg.replace(/#/g, "%23").replace(/"/g, "'") + "\")";
  }
  function aplicar() {
    var hero = document.querySelector(".hero");
    if (!hero || hero.dataset.marca) return;
    hero.dataset.marca = "1";
    var cs = getComputedStyle(hero);
    hero.style.backgroundImage = fundo() + ", " + cs.backgroundImage;
    hero.style.backgroundRepeat = "repeat, " + cs.backgroundRepeat;
    hero.style.backgroundSize = "auto, " + cs.backgroundSize;
    hero.style.backgroundPosition = "0 0, " + cs.backgroundPosition;
  }
  function iniciar() {
    aplicar();
    new MutationObserver(aplicar).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();
