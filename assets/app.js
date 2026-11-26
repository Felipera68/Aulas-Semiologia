(function () {
  "use strict";

  var app = document.getElementById("app");
  var KEY = "semio.progresso.v1";
  var NIVEIS = {
    dificil: "Difícil",
    muito_dificil: "Muito difícil",
    prova: "Nível prova de medicina"
  };
  var LETRAS = ["A", "B", "C", "D", "E"];

  // ---------- utilidades ----------
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function lerProgresso() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function salvarProgresso(p) {
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* sem armazenamento: segue sem salvar */ }
  }

  function registrar(aulaId, questao, escolhida) {
    var p = lerProgresso();
    p[aulaId] = p[aulaId] || { respostas: {} };
    p[aulaId].respostas[questao.id] = {
      ok: escolhida === questao.gabarito,
      escolhida: escolhida,
      nivel: questao.nivel,
      t: Date.now()
    };
    salvarProgresso(p);
  }

  function aulaFull(id) { return (window.AULAS || {})[id]; }

  function resumoAula(id) {
    var r = (lerProgresso()[id] || {}).respostas || {};
    var ids = Object.keys(r);
    var acertos = ids.filter(function (k) { return r[k].ok; }).length;
    return { feitas: ids.length, acertos: acertos };
  }

  function setTitle(t) { document.title = t + " · Semiologia"; }

  // Link para a página do PDF original (sem slides separados)
  function linkSlide(a, n, texto) {
    if (n === null || n === undefined || n === "") {
      return "<a href='" + esc(a.pdf) + "' target='_blank' rel='noopener'>" + (texto || "abrir PDF da aula") + "</a>";
    }
    return "<a href='" + esc(a.pdf) + "#page=" + n + "' target='_blank' rel='noopener'>" + (texto || ("slide " + n)) + "</a>";
  }

  // ---------- início: escolha da área ----------
  var PROFESSORES_AGRESSAO = [
    { slug: "thiago", nome: "Thiago" },
    { slug: "gilmar", nome: "Gilmar" },
    { slug: "natalia", nome: "Natália" }
  ];

  function paginaHome() {
    setTitle("Início");
    app.innerHTML =
      "<section class='hero'>" +
        "<h1>Plataforma de estudo</h1>" +
        "<p>Escolha a matéria.</p>" +
      "</section>" +
      "<div class='grid'>" +
        "<a class='card' href='#/semiologia'><h3>Semiologia</h3><p>Aulas de semiologia osteomioarticular, tegumentar e GU.</p></a>" +
        "<a class='card' href='#/agressao'><h3>Agressão e Defesa</h3><p>Professores Thiago, Gilmar e Natália.</p></a>" +
      "</div>";
  }

  function paginaAgressao() {
    setTitle("Agressão e Defesa");
    var cards = PROFESSORES_AGRESSAO.map(function (p) {
      return "<a class='card' href='#/agressao/" + esc(p.slug) + "'><h3>Professor " + esc(p.nome) + "</h3><p>Aulas em breve.</p></a>";
    }).join("");
    app.innerHTML =
      "<div class='crumb'><a href='#/'>Início</a> / Agressão e Defesa</div>" +
      "<h2 class='page'>Agressão e Defesa</h2>" +
      "<p class='sub'>Escolha o professor.</p>" +
      "<div class='grid'>" + cards + "</div>";
  }

  function paginaProfessorAgressao(slug) {
    var p = PROFESSORES_AGRESSAO.filter(function (x) { return x.slug === slug; })[0];
    if (!p) { app.innerHTML = "<p>Professor não encontrado.</p>"; return; }
    setTitle("Professor " + p.nome);
    var idx = (window.INDICE_AGRESSAO || {})[slug] || [];
    var cards = idx.map(function (a) {
      var r = resumoAula(a.id);
      var n = aulaFull(a.id) && aulaFull(a.id).questoes ? aulaFull(a.id).questoes.length : 15;
      var p2 = r.feitas ? Math.round(100 * r.acertos / r.feitas) : 0;
      return "<a class='card' href='#/aula/" + esc(a.id) + "'><h3>" + esc(a.titulo) + "</h3><p>" + esc(a.subtitulo) + "</p>" +
        "<div class='bar'><i style='width:" + p2 + "%'></i></div>" +
        (aulaFull(a.id) && aulaFull(a.id).questoes ? "<span class='badge ok'>" + r.feitas + "/" + n + " respondidas" + (r.feitas ? " · " + p2 + "% acerto" : "") + "</span>" : "") + "</a>";
    }).join("");
    app.innerHTML =
      "<div class='crumb'><a href='#/'>Início</a> / <a href='#/agressao'>Agressão e Defesa</a> / " + esc(p.nome) + "</div>" +
      "<h2 class='page'>Professor " + esc(p.nome) + "</h2>" +
      (cards ? "<p class='sub'>" + (slug === "natalia" ? "Microbiologia: roteiro e aulas." : "Aulas de imunologia.") + "</p><div class='grid'>" + cards + "</div>" : "<p class='sub'>Aulas em breve.</p>");
  }

  // ---------- comparativo (tabela) ----------
  function renderTabela(a) {
    var t = a.tabela;
    if (!t) return "<div class='panel'><p>Sem comparativo nesta aula.</p></div>";
    return "<div class='panel'><h3>" + esc(t.titulo) + "</h3><div style='overflow-x:auto'><table class='comp'><thead><tr>" +
      t.colunas.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      t.linhas.map(function (l) {
        return "<tr>" + l.map(function (c, i) { return i === 0 ? "<th>" + esc(c) + "</th>" : "<td>" + esc(c) + "</td>"; }).join("") + "</tr>";
      }).join("") + "</tbody></table></div></div>";
  }

  // ---------- landing: semiologia ----------
  function paginaInicio() {
    setTitle("Aulas de semiologia");
    var idx = window.INDICE_AULAS || [];
    var disponiveis = idx.filter(function (a) { return a.status === "disponivel"; }).length;
    var totalFeitas = 0, totalAcertos = 0;
    idx.forEach(function (a) { var r = resumoAula(a.id); totalFeitas += r.feitas; totalAcertos += r.acertos; });
    var pct = totalFeitas ? Math.round(100 * totalAcertos / totalFeitas) : 0;

    var cards = idx.map(function (a) {
      var disp = a.status === "disponivel";
      var r = resumoAula(a.id);
      var p = r.feitas ? Math.round(100 * r.acertos / r.feitas) : 0;
      var inner =
        "<h3>" + esc(a.titulo) + "</h3>" +
        "<p>" + esc(a.subtitulo) + "</p>" +
        (disp
          ? "<div class='bar'><i style='width:" + p + "%'></i></div>" +
            "<span class='badge ok'>Disponível · " + r.feitas + "/" + ((aulaFull(a.id) && aulaFull(a.id).questoes) ? aulaFull(a.id).questoes.length : 15) + " respondidas" + (r.feitas ? " · " + p + "% acerto" : "") + "</span>"
          : "<span class='badge'>Em breve</span>");
      return disp
        ? "<a class='card' href='#/aula/" + esc(a.id) + "'>" + inner + "</a>"
        : "<div class='card locked'>" + inner + "</div>";
    }).join("");

    app.innerHTML =
      "<div class='crumb'><a href='#/'>Início</a> / Semiologia</div>" +
      "<section class='hero'>" +
        "<h1>Semiologia osteomioarticular, tegumentar e GU</h1>" +
        "<p class='autor'>Felipe Alberton</p>" +
        "<p>Resumo, glossário com epônimos, caso clínico guiado, imagens explicadas e quiz de 15 questões por aula.</p>" +
        "<div class='stats'>" +
          "<span class='pill'>" + disponiveis + " aula(s) disponível(is)</span>" +
          "<span class='pill'>" + totalFeitas + " questões feitas</span>" +
          "<span class='pill'>" + pct + "% de acerto geral</span>" +
        "</div>" +
      "</section>" +
      "<div class='grid'>" +
        "<a class='card' href='#/semiologia/manobras'><h3>Simulado de manobras</h3><p>Resumo de todas as manobras, da cabeça aos pés, com slide do professor, e quiz de manobras.</p></a>" +
        cards + "</div>";
  }

  // ---------- página da aula ----------
  var ABAS = [
    ["resumo", "Resumo"],
    ["glossario", "Epônimos e termos"],
    ["caso", "Caso clínico"],
    ["condutas", "Condutas/Medicações"],
    ["quiz", "Quiz"],
    ["imagens", "Imagens"],
    ["manobras", "Manobras"],
    ["tabela", "Comparativo"],
    ["pdf", "PDF"]
  ];

  function paginaAula(id, aba, extra) {
    var a = aulaFull(id);
    if (!a) { app.innerHTML = "<p>Aula não encontrada.</p>"; return; }
    setTitle(a.titulo);
    var abasAula = a.abas ? ABAS.filter(function (t) { return a.abas.indexOf(t[0]) >= 0; }) : ABAS;
    aba = aba || abasAula[0][0];
    if (a.abas && a.abas.indexOf(aba) < 0) aba = abasAula[0][0];

    var tabs = "<nav class='tabs' role='tablist'>" + abasAula.map(function (t) {
      return "<button role='tab' aria-selected='" + (t[0] === aba) + "' data-go='#/aula/" + esc(id) + "/" + t[0] + "'>" + t[1] + "</button>";
    }).join("") + "</nav>";

    var corpo = "";
    if (aba === "resumo") corpo = renderResumo(a);
    else if (aba === "glossario") corpo = renderGlossario(a);
    else if (aba === "caso") corpo = renderCaso(a);
    else if (aba === "quiz") corpo = renderQuizInicio(a);
    else if (aba === "condutas") corpo = renderCondutas(a);
    else if (aba === "imagens") corpo = renderImagens(a);
    else if (aba === "manobras") corpo = renderManobras(a);
    else if (aba === "tabela") corpo = renderTabela(a);
    else if (aba === "pdf") corpo = "<div class='panel'><p class='note'><a class='btn-pdf' href='" + esc(a.pdf) + "' target='_blank' rel='noopener'>Abrir PDF completo em nova aba</a></p><p class='note'>No celular, use o botão acima para rolar todas as páginas. A visualização abaixo mostra só a primeira página em alguns aparelhos.</p>" + (a.pdf2 ? "<p class='note'><a class='btn-pdf' href='" + esc(a.pdf2) + "' target='_blank' rel='noopener'>Abrir gabarito comentado</a></p>" : "") + "<iframe class='pdf-frame' src='" + esc(a.pdf) + "' title='PDF da aula'></iframe></div>";

    app.innerHTML =
      (a.voltar
        ? "<div class='crumb'><a href='#/'>Início</a> / <a href='#/agressao'>Agressão e Defesa</a> / <a href='" + esc(a.voltar.href) + "'>" + esc(a.voltar.texto) + "</a> / " + esc(a.titulo) + "</div>"
        : "<div class='crumb'><a href='#/'>Início</a> / <a href='#/semiologia'>Semiologia</a> / " + esc(a.titulo) + "</div>") +
      "<h2 class='page'>" + esc(a.titulo) + "</h2>" +
      "<p class='sub'>" + esc(a.subtitulo) + "</p>" +
      tabs + "<div id='conteudo'>" + corpo + "</div>";

    if (aba === "glossario") ligarBuscaGlossario();
    if (aba === "quiz") ligarQuiz(a);
    if (aba === "caso") ligarCaso(a);
    if (aba === "imagens" && extra) {
      var alvo = document.getElementById("img-" + extra);
      if (alvo) alvo.scrollIntoView({ block: "start" });
    }
  }

  // Negrito no início do ponto: até o primeiro ":" (ou o primeiro ponto final), se for curto
  // "slide N" / "slides N" viram link para a página do PDF
  function comSlides(a, texto) {
    return String(texto).split(/(slides?\s+\d+)/i).map(function (p, i) {
      if (i % 2 === 1) return linkSlide(a, p.match(/\d+/)[0], esc(p));
      return esc(p);
    }).join("");
  }

  function negritoInicio(a, texto) {
    var m = texto.match(/^([^:]{2,70}):\s/) || texto.match(/^([^.]{2,70})\.\s/);
    if (!m) return comSlides(a, texto);
    return "<b>" + comSlides(a, m[1]) + (texto.charAt(m[1].length) === ":" ? ":" : ".") + "</b> " + comSlides(a, texto.slice(m[0].length));
  }

  function renderResumo(a) {
    var secoes = a.resumo.map(function (s) {
      return "<h3>" + esc(s.titulo) + "</h3><ul class='resumo'>" + s.pontos.map(function (p) {
        if (typeof p === "string") return "<li>" + negritoInicio(a, p) + "</li>";
        return "<li><b>" + comSlides(a, p.t) + "</b><ul>" + p.sub.map(function (x) { return "<li>" + comSlides(a, x) + "</li>"; }).join("") + "</ul></li>";
      }).join("") + "</ul>";
    }).join("");
    var fontes = "<p class='note'>Fontes citadas no material: " + a.fontes.map(esc).join("; ") + ".</p>";
    return "<div class='panel'>" + secoes + fontes + "</div>";
  }

  function renderGlossario(a) {
    var itens = a.glossario.map(function (g) {
      return "<div class='item' data-txt='" + esc((g.termo + " " + (g.epônimo || "") + " " + g.tecnica + " " + g.definicao).toLowerCase()) + "'>" +
        "<div><span class='term'>" + esc(g.termo) + "</span>" +
        (g.epônimo && g.termo.toLowerCase().indexOf(g.epônimo.toLowerCase()) === -1 ? "<span class='epo'>epônimo: " + esc(g.epônimo) + "</span>" : "") + "</div>" +
        "<div class='tec'>Técnica: " + esc(g.tecnica) + "</div>" +
        "<div>" + esc(g.definicao) + " " + linkSlide(a, g.slide) + "</div>" +
        "</div>";
    }).join("");
    if (!a.glossario.length) return "<div class='panel'><p>Esta aula não tem epônimos citados nos slides.</p></div>";
    return "<div class='panel'><input id='busca' type='search' placeholder='Buscar termo, epônimo ou técnica' class='btn' style='width:100%;margin-bottom:12px;text-align:left'>" +
      "<div class='gloss' id='lista'>" + itens + "</div></div>";
  }

  function ligarBuscaGlossario() {
    var campo = document.getElementById("busca");
    if (!campo) return;
    campo.addEventListener("input", function () {
      var q = campo.value.trim().toLowerCase();
      var itens = document.querySelectorAll("#lista .item");
      for (var i = 0; i < itens.length; i++) {
        var txt = itens[i].getAttribute("data-txt") || "";
        itens[i].style.display = (!q || txt.indexOf(q) !== -1) ? "" : "none";
      }
    });
  }

  // ---------- caso clínico guiado (etapas em ordem cronológica) ----------
  function renderCaso(a) {
    return "<div class='panel' id='caso'></div>" + casosExtremosHtml(a);
  }

  // ---------- casos de nível extremo (3 por aula; alternativa clicável com gabarito) ----------
  function casosExtremosHtml(a) {
    var cs = a.casos_extremos || [];
    if (!cs.length) return "";
    if (!window.__ceOn) {
      window.__ceOn = true;
      document.addEventListener("click", function (e) {
        var b = e.target.closest ? e.target.closest(".ce-alt") : null;
        if (!b) return;
        var q = b.closest(".ce-q");
        if (!q || q.getAttribute("data-feito")) return;
        q.setAttribute("data-feito", "1");
        var ok = b.getAttribute("data-letra") === b.getAttribute("data-gab");
        b.style.borderColor = ok ? "#2e7d32" : "#c62828";
        b.style.fontWeight = "bold";
        var gab = b.getAttribute("data-gab");
        var gb = q.querySelector(".ce-alt[data-letra='" + gab + "']");
        if (gb) gb.style.borderColor = "#2e7d32";
        q.querySelector(".ce-fb").textContent = (ok ? "Correto. " : "Errado. Gabarito: " + gab + ". ") + b.getAttribute("data-just");
      });
    }
    return "<div class='panel'><h3>Casos de nível extremo</h3>" +
      "<p class='sub'>Três casos por aula. Escolha uma alternativa: a resposta e a justificativa aparecem na hora.</p>" +
      cs.map(function (c, ci) {
        return "<div class='ce-caso'><h4>" + esc(c.titulo) + "</h4><p>" + esc(c.texto) + "</p>" +
          c.perguntas.map(function (p, pi) {
            return "<div class='ce-q' data-ci='" + ci + "' data-pi='" + pi + "'><p><b>" + esc(p.pergunta) + "</b></p>" +
              p.alternativas.map(function (t, k) {
                var L = "ABCDE".charAt(k);
                return "<button class='btn ce-alt' style='display:block;width:100%;text-align:left;margin:4px 0' data-gab='" + esc(p.gabarito) + "' data-letra='" + L + "' data-just='" + esc(p.justificativa) + "'>" + L + ") " + esc(t) + "</button>";
              }).join("") +
              "<p class='note ce-fb'></p></div>";
          }).join("") + "</div>";
      }).join("") + "</div>";
  }

  // ---------- caso clínico guiado com alternativas (etapas em ordem cronológica) ----------
  function ligarCaso(a) {
    var c = a.caso;
    var etapas = c.etapas;
    var k = 0;
    var acertos = 0, total = 0;
    var respondidas = {};
    var box = document.getElementById("caso");
    var LETRAS_CASO = ["A", "B", "C", "D", "E"];

    function explicacoes(p, escolhida) {
      return LETRAS_CASO.map(function (L, i) {
        var certa = L === p.gabarito;
        var txt = certa ? p.justificativa : (p.erradas && p.erradas[L]) || "";
        var rotulo = certa ? "Correta" : (L === escolhida ? "Sua escolha" : "Errada");
        return "<li class='" + (certa ? "ok" : "bad") + "'><b>" + L + ") " + rotulo + ":</b> " + esc(txt) + "</li>";
      }).join("");
    }

    function cartaoPergunta(p, idx) {
      var chave = k + ":" + idx;
      var escolhida = respondidas[chave];
      var jaRespondeu = escolhida !== undefined;
      var opts = p.alternativas.map(function (alt, i) {
        var L = LETRAS_CASO[i];
        var cls = "opt";
        if (jaRespondeu && L === p.gabarito) cls += " right";
        if (jaRespondeu && L === escolhida && L !== p.gabarito) cls += " wrong";
        return "<button class='" + cls + "' data-caso-l='" + L + "' data-caso-q='" + idx + "' " + (jaRespondeu ? "disabled" : "") + ">" +
          "<span class='l'>" + L + ")</span>" + esc(alt) + "</button>";
      }).join("");
      var fb = jaRespondeu
        ? "<div class='feedback " + (escolhida === p.gabarito ? "ok" : "bad") + "'>" +
            "<div class='tag'>" + (escolhida === p.gabarito ? "Você acertou" : "Você errou. Gabarito: " + p.gabarito) + "</div>" +
            "<ul class='explica'>" + explicacoes(p, escolhida) + "</ul></div>"
        : "";
      return "<div class='qa mc' data-q='" + idx + "'>" +
        "<div class='qtext'><b>" + (idx + 1) + ".</b> " + esc(p.pergunta) + "</div>" +
        "<div class='opts'>" + opts + "</div>" + fb + "</div>";
    }

    function desenhar() {
      var e = etapas[k];
      var perguntas = e.perguntas.map(function (p, i) { return cartaoPergunta(p, i); }).join("");
      var ultima = k === etapas.length - 1;
      box.innerHTML =
        "<h3>" + esc(c.titulo) + "</h3>" +
        "<p class='meta'>" + esc(c.perfil) + "</p>" +
        "<div class='bar'><i style='width:" + Math.round(100 * (k + 1) / etapas.length) + "%'></i></div>" +
        "<p class='meta'>Etapa " + (k + 1) + " de " + etapas.length + " · acertos até agora: " + acertos + "/" + total + "</p>" +
        "<h3>" + esc(e.titulo) + "</h3>" +
        "<div class='case-text'>" + esc(e.texto) + "</div>" +
        "<h3>Pense antes de marcar: as alternativas são plausíveis de propósito</h3>" + perguntas +
        "<div class='row' style='margin-top:16px;justify-content:space-between'>" +
          "<button class='btn' id='c-ant' " + (k === 0 ? "disabled" : "") + ">&larr; Etapa anterior</button>" +
          (ultima
            ? "<button class='btn primary' id='c-fim'>Concluir caso</button>"
            : "<button class='btn primary' id='c-prox'>Próxima etapa &rarr;</button>") +
        "</div>";

      var botoes = box.querySelectorAll("[data-caso-l]");
      for (var b = 0; b < botoes.length; b++) {
        botoes[b].onclick = function (ev) {
          var L = ev.currentTarget.getAttribute("data-caso-l");
          var idx = parseInt(ev.currentTarget.getAttribute("data-caso-q"), 10);
          var chave = k + ":" + idx;
          if (respondidas[chave] !== undefined) return;
          respondidas[chave] = L;
          total++;
          if (L === e.perguntas[idx].gabarito) acertos++;
          desenhar();
        };
      }
      var ant = document.getElementById("c-ant");
      if (ant) ant.onclick = function () { k = Math.max(0, k - 1); desenhar(); box.scrollIntoView({ block: "start" }); };
      var prox = document.getElementById("c-prox");
      if (prox) prox.onclick = function () { k = Math.min(etapas.length - 1, k + 1); desenhar(); box.scrollIntoView({ block: "start" }); };
      var fim = document.getElementById("c-fim");
      if (fim) fim.onclick = function () {
        box.innerHTML = "<h3>Caso concluído</h3>" +
          "<p><b>" + acertos + " de " + total + " respostas corretas.</b> Revise as explicações das alternativas erradas: é aí que está o detalhe da prova.</p>" +
          "<div class='row'><button class='btn primary' id='c-refazer'>Refazer caso</button></div>";
        document.getElementById("c-refazer").onclick = function () { k = 0; acertos = 0; total = 0; respondidas = {}; desenhar(); box.scrollIntoView({ block: "start" }); };
      };
    }

    desenhar();
  }

  // ---------- condutas e medicações ----------
  function listaHtml(itens, ordenada) {
    var tag = ordenada ? "ol" : "ul";
    return "<" + tag + ">" + itens.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</" + tag + ">";
  }

  // Referências clicáveis: usa o link oficial quando existe; senão, pesquisa o texto da referência.
  var pdfAtual = "";
  function refLink(r) {
    var texto = typeof r === "string" ? r : (r.texto || "");
    var url = typeof r === "string" ? "" : (r.url || "");
    var temSlide = /slides?\s+\d/i.test(texto);
    if (!url && temSlide && pdfAtual) {
      return esc(texto).replace(/(slides?\s+)(\d+(?:(?:\s*(?:,|e)\s*)\d+)*)/gi, function (all, pre, nums) {
        return pre + nums.replace(/\d+/g, function (n) {
          return "<a href='" + esc(pdfAtual) + "#page=" + n + "' target='_blank' rel='noopener'>" + n + "</a>";
        });
      });
    }
    if (!url && /material do professor/i.test(texto) && pdfAtual) {
      return "<a href='" + esc(pdfAtual) + "' target='_blank' rel='noopener'>" + esc(texto) + "</a>";
    }
    var alvo = url || ("https://www.google.com/search?q=" + encodeURIComponent(texto.replace(/\s+/g, " ").slice(0, 200)));
    return "<a href='" + esc(alvo) + "' target='_blank' rel='noopener'>" + esc(texto) + "</a>";
  }
  function listaRefs(itens) {
    return "<ul>" + itens.map(function (r) { return "<li>" + refLink(r) + "</li>"; }).join("") + "</ul>";
  }

  // Medicação com "ref" herda mecanismo e detalhes da conduta da lombociatalgia
  function resolveMed(m) {
    if (!m.ref) return m;
    var base = ((window.CONDUTAS || {})["aula-08"] || { condutas: [] }).condutas[0];
    var achado = base ? base.medicacoes.filter(function (b) { return b.nome_comercial.indexOf(m.ref) === 0; })[0] : null;
    if (!achado) return m;
    var out = {};
    Object.keys(achado).forEach(function (k) { out[k] = achado[k]; });
    Object.keys(m).forEach(function (k) {
      var v = m[k];
      if (k === "ref" || k === "porque_ref") return;
      if (typeof v === "string" && v.indexOf("Ver conduta") === 0) return;
      out[k] = v;
    });
    out.nome_comercial = m.nome_comercial;
    out.nota_ref = "Mecanismo completo na conduta da lombociatalgia.";
    return out;
  }

  // Só o nome, sem exemplos entre parênteses (ex.: "Vancomicina" e não "Vancomicina (ex.: Vancocin)")
  function nomeBase(t) { return String(t || "").split(/ \(| e |,/)[0]; }

  function cardMedicacao(m, aid) {
    m = resolveMed(m);
    var campos = [
      ["Nome comercial", nomeBase(m.nome_comercial)],
      ["Nome genérico", m.nome_generico],
      ["Classe (nome clínico)", m.classe],
      ["Dose", m.dose],
      ["Posologia", m.posologia],
      ["Indicação", m.indicacao],
      ["Por que usar", m.porque]
    ];
    var linhas = campos.filter(function (c) { return c[1]; }).map(function (c) {
      return "<dt>" + esc(c[0]) + "</dt><dd>" + esc(c[1]) + "</dd>";
    }).join("");
    return "<article class='panel med' id='" + esc(aid || "") + "'>" +
      "<h3>" + esc(nomeBase(m.nome_comercial)) + (m.linha ? " <span class='linha'>" + esc(m.linha) + "</span>" : "") + "</h3>" +
      "<dl class='medicamento'>" + linhas + "</dl>" +
      (m.nota_ref ? "<p class='note'>" + esc(m.nota_ref) + "</p>" : "") +
      "<h4>Como age, passo a passo</h4>" + listaHtml(m.mecanismo || [], true) +
      (m.termos ? "<details class='termos'><summary>Termos explicados</summary>" + listaHtml(m.termos, false) + "</details>" : "") +
      "<h4>Efeitos adversos</h4><p>" + esc(m.efeitos_adversos) + "</p>" +
      (m.contraindicacoes ? "<h4>Contraindicações</h4><p>" + esc(m.contraindicacoes) + "</p>" : "") +
      (m.cuidados ? "<h4>Cuidados</h4><p>" + esc(m.cuidados) + "</p>" : "") +
      "<h4>Referências</h4>" + listaRefs(m.referencias || []) +
      "</article>";
  }

  function cardNaoIndicada(m, aid) {
    return "<article class='panel med nao' id='" + esc(aid || "") + "'>" +
      "<h3>" + esc(nomeBase(m.nome_comercial)) + "</h3>" +
      "<dl class='medicamento'>" +
        "<dt>Nome genérico</dt><dd>" + esc(m.nome_generico) + "</dd>" +
        "<dt>Classe (nome clínico)</dt><dd>" + esc(m.classe) + "</dd>" +
        "<dt>Por que NÃO usar aqui</dt><dd>" + esc(m.por_que_nao_indicada) + "</dd>" +
      "</dl>" +
      "<h4>Mecanismo (para estudo)</h4>" + listaHtml(m.mecanismo_para_estudo, true) +
      (m.termos ? "<details class='termos'><summary>Termos explicados</summary>" + listaHtml(m.termos, false) + "</details>" : "") +
      "<h4>Referências</h4>" + listaRefs(m.referencias || []) +
      "</article>";
  }

  function renderCondutas(a) {
    pdfAtual = a.pdf;
    var dados = (window.CONDUTAS || {})[a.id];
    if (!dados) return "<div class='panel'><p>Condutas desta aula ainda não foram criadas.</p></div>";

    var sumario = "<nav class='sumario' aria-label='Sumário das condutas'><b>Sumário</b><ol>" +
      dados.condutas.map(function (c) {
        var meds = c.medicacoes.map(function (m, i) {
          return "<li><a href='#cond-" + c.id + "-m" + i + "'>" + esc(m.nome_comercial.split(/ \(| e |,/)[0]) + "</a></li>";
        }).join("");
        var naoUsar = (c.medicacoes_nao_indicadas || []).map(function (m, i) {
          return "<li class='nao'><a href='#cond-" + c.id + "-n" + i + "'>" + esc(m.nome_comercial.split(/ \(| e |,/)[0]) + " <i>(não usar)</i></a></li>";
        }).join("");
        return "<li class='grupo'><a class='titulo' href='#cond-" + c.id + "'>" + esc(c.titulo) + "</a><ul>" +
          meds + naoUsar + "</ul></li>";
      }).join("") +
      "</ol></nav>";

    var blocos = dados.condutas.map(function (c) {
      return "<section class='conduta' id='cond-" + c.id + "'>" +
        "<h2 class='page'>" + esc(c.titulo) + "</h2>" +
        "<p class='note'>" + esc(c.caso) + "</p>" +
        "<div class='panel'><p>" + esc(c.resumo) + "</p>" +
          "<h3>Passo a passo da conduta</h3>" +
          c.passos.map(function (p) { return "<h4>" + esc(p.titulo) + "</h4><p>" + esc(p.texto) + "</p>"; }).join("") +
        "</div>" +
        (c.hierarquia ? "<div class='panel hier'><h3>Hierarquia do tratamento</h3>" + listaHtml(c.hierarquia, false) + "</div>" : "") +
        "<h3 class='sec'>Medicações indicadas</h3>" +
        c.medicacoes.map(function (m, i) { return cardMedicacao(m, "cond-" + c.id + "-m" + i); }).join("") +
        ((c.medicacoes_nao_indicadas || []).length
          ? "<h3 class='sec'>Medicações que NÃO devem ser usadas nesta situação</h3>" +
            c.medicacoes_nao_indicadas.map(function (m, i) { return cardNaoIndicada(m, "cond-" + c.id + "-n" + i); }).join("")
          : "") +
        "<div class='panel'><h3>Referências gerais</h3>" +
          listaRefs(c.referencias_gerais || []) +
        "</div></section>";
    }).join("");

    return "<div class='panel aviso'><b>Aviso:</b> " + esc(dados.aviso) + "</div>" +
      "<div class='cond-wrap'>" + sumario + "<div class='cond-main'>" + blocos + "</div></div>";
  }

  // ---------- imagens explicadas ----------
  // ---------- manobras (conforme os slides, com significado clínico) ----------
  function renderManobras(a) {
    var lista = a.manobras || [];
    if (!lista.length) return "<div class='panel'><p>Manobras desta aula ainda não foram cadastradas.</p></div>";
    var cards = lista.map(function (m) {
      return "<article class='panel manobra'>" +
        "<h3>" + esc(m.nome) + (m.epônimo ? " <span class='epo'>" + esc(m.epônimo) + "</span>" : "") + "</h3>" +
        "<dl class='medicamento'>" +
          "<dt>Como fazer</dt><dd>" + esc(m.como) + "</dd>" +
          "<dt>Resultado alterado</dt><dd>" + esc(m.alterado) + "</dd>" +
          "<dt>O que significa</dt><dd>" + esc(m.significado) + "</dd>" +
          (m.slide ? "<dt>Slide</dt><dd>" + linkSlide(a, m.slide) + "</dd>" : "") +
        "</dl></article>";
    }).join("");
    return "<p class='sub'>Manobras conforme os slides. Para cada uma: como fazer, o que significa o resultado alterado e a interpretação clínica.</p>" + cards;
  }

  function renderImagens(a) {
    var itens = (a.imagens || []).map(function (im) {
      var num = ("0" + im.slide).slice(-2);
      return "<article class='card img-card' id='img-" + im.slide + "'>" +
        "<a href='img/" + esc(a.id) + "/slide-" + num + ".jpg' target='_blank' rel='noopener' title='Abrir imagem em tamanho cheio'>" +
          "<img src='img/" + esc(a.id) + "/slide-" + num + ".jpg' alt='" + esc(im.titulo) + "' loading='lazy'>" +
        "</a>" +
        "<h3>" + esc(im.titulo) + "</h3>" +
        "<p>" + esc(im.explicacao) + "</p>" +
        "<p class='note'>Slide " + im.slide + " · " + linkSlide(a, im.slide, "ver no PDF") + "</p>" +
        "</article>";
    }).join("");
    return "<p class='sub'>Figuras dos slides do professor, com explicação do que observar. Clique na imagem para ampliar.</p>" +
      "<div class='grid img-grid'>" + itens + "</div>";
  }

  // ---------- quiz ----------
  function renderQuizInicio(a) {
    var r = (lerProgresso()[a.id] || {}).respostas || {};
    var erradas = Object.keys(r).filter(function (k) { return !r[k].ok; }).length;
    return "<div class='panel'>" +
      "<h3>Como estudar</h3>" +
      "<ul><li><b>Estudo:</b> feedback após cada resposta, com justificativa, epônimo, técnica e slide.</li>" +
      "</ul>" +
      "<div class='row' style='margin-top:12px'>" +
        "<label class='meta'><input type='checkbox' id='so-erros'" + (erradas ? "" : " disabled") + "> só erros anteriores (" + erradas + ")</label>" +
      "</div>" +
      "<div class='row' style='margin-top:14px'><button class='btn primary' id='comecar'>Começar</button></div>" +
      "</div><div id='quiz'></div>";
  }

  function ligarQuiz(a) {
    document.getElementById("comecar").onclick = function () {
      var modo = "estudo";
      var nivel = "todos";
      var soErros = document.getElementById("so-erros") && document.getElementById("so-erros").checked;
      var r = (lerProgresso()[a.id] || {}).respostas || {};
      var lista = a.questoes.filter(function (q) {
        if (nivel !== "todos" && q.nivel !== nivel) return false;
        if (soErros && (!r[q.id] || r[q.id].ok)) return false;
        return true;
      });
      if (!lista.length) { document.getElementById("quiz").innerHTML = "<p class='panel'>Nenhuma questão com esse filtro.</p>"; return; }
      rodarQuiz(a, lista, modo);
    };
  }

  function rodarQuiz(a, lista, modo) {
    var i = 0, respostas = {}, box = document.getElementById("quiz");

    function desenhar() {
      var q = lista[i];
      var jaRespondida = respostas[q.id] !== undefined;
      var letraEscolhida = respostas[q.id];
      var bloqueia = jaRespondida && modo === "estudo";
      var opts = q.alternativas.map(function (alt, k) {
        var letra = LETRAS[k];
        var cls = "opt";
        if (bloqueia && letra === q.gabarito) cls += " right";
        if (bloqueia && letra === letraEscolhida && letra !== q.gabarito) cls += " wrong";
        return "<button class='" + cls + "' data-l='" + letra + "' " + (bloqueia ? "disabled" : "") + ">" +
          "<span class='l'>" + letra + ")</span>" + esc(alt) + "</button>";
      }).join("");

      var feedback = "";
      if (bloqueia) {
        var certa = letraEscolhida === q.gabarito;
        feedback = "<div class='feedback " + (certa ? "ok" : "bad") + "'>" +
          "<div class='tag'>" + (certa ? "Correto" : "Errado. Gabarito: " + q.gabarito) + "</div>" +
          "<div>" + esc(q.justificativa) + "</div>" +
          "<dl>" +
            (q.epônimo ? "<dt>Epônimo</dt><dd>" + esc(q.epônimo) + "</dd>" : "") +
            "<dt>Técnica</dt><dd>" + esc(q.tecnica) + "</dd>" +
            "<dt>Slide</dt><dd>" + linkSlide(q.pdf ? { pdf: q.pdf } : a, q.slide) + "</dd>" +
          "</dl></div>";
      }

      var ultima = i === lista.length - 1;
      var nav = "<div class='row' style='margin-top:14px;justify-content:space-between'>" +
        "<button class='btn' id='q-ant' " + (i === 0 ? "disabled" : "") + ">&larr; Anterior</button>" +
        (ultima && (modo === "prova" || jaRespondida)
          ? "<button class='btn primary' id='q-fim'>Ver resultado</button>"
          : "<button class='btn primary' id='q-prox' " + (modo === "prova" || jaRespondida ? "" : "disabled") + ">Próxima &rarr;</button>") +
        "</div>";

      box.innerHTML = "<div class='panel'>" +
        "<div class='quiz-head'><span class='qnum'>Questão " + (i + 1) + " de " + lista.length + "</span>" +
        "<span class='level'>" + esc(NIVEIS[q.nivel]) + "</span></div>" +
        "<div class='bar'><i style='width:" + Math.round(100 * (i + 1) / lista.length) + "%'></i></div>" +
        "<div class='qtext'>" + esc(q.enunciado) + "</div>" +
        "<div class='opts'>" + opts + "</div>" + feedback + nav + "</div>";

      var botoes = box.querySelectorAll(".opt");
      for (var b = 0; b < botoes.length; b++) {
        botoes[b].onclick = function (ev) {
          var letra = ev.currentTarget.getAttribute("data-l");
          if (respostas[q.id] !== undefined) return;
          respostas[q.id] = letra;
          registrar(a.id, q, letra);
          desenhar();
        };
      }
      var ant = document.getElementById("q-ant");
      if (ant) ant.onclick = function () { i = Math.max(0, i - 1); desenhar(); };
      var prox = document.getElementById("q-prox");
      if (prox) prox.onclick = function () { i = Math.min(lista.length - 1, i + 1); desenhar(); };
      var fim = document.getElementById("q-fim");
      if (fim) fim.onclick = resultado;
    }

    function resultado() {
      var acertos = 0, respondidas = 0, porNivel = {};
      lista.forEach(function (q) {
        porNivel[q.nivel] = porNivel[q.nivel] || { n: 0, ok: 0 };
        porNivel[q.nivel].n++;
        if (respostas[q.id] !== undefined) {
          respondidas++;
          if (respostas[q.id] === q.gabarito) { acertos++; porNivel[q.nivel].ok++; }
        }
      });
      var linhas = Object.keys(porNivel).map(function (k) {
        return "<div class='stat'><span class='meta'>" + esc(NIVEIS[k]) + "</span><b>" + porNivel[k].ok + "/" + porNivel[k].n + "</b></div>";
      }).join("");
      var pct = respondidas ? Math.round(100 * acertos / respondidas) : 0;
      box.innerHTML = "<div class='panel'><h3>Resultado</h3>" +
        "<p><b>" + acertos + " de " + respondidas + " corretas</b> (" + pct + "%)</p>" +
        "<div class='stats-grid'>" + linhas + "</div>" +
        "<div class='row' style='margin-top:14px'><button class='btn primary' id='refazer'>Voltar ao quiz</button>" +
        "<a class='btn' href='#/desempenho'>Ver desempenho</a></div></div>";
      document.getElementById("refazer").onclick = function () { box.innerHTML = ""; };
    }

    desenhar();
    box.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ---------- desempenho ----------
  function paginaDesempenho() {
    setTitle("Desempenho");
    var p = lerProgresso();
    var idx = (window.INDICE_AULAS || []).filter(function (a) { return a.status === "disponivel"; });
    var blocos = idx.map(function (a) {
      var r = (p[a.id] || {}).respostas || {};
      var ids = Object.keys(r);
      var niv = {};
      ids.forEach(function (k) {
        var n = r[k].nivel;
        niv[n] = niv[n] || { n: 0, ok: 0 };
        niv[n].n++; if (r[k].ok) niv[n].ok++;
      });
      var linhas = Object.keys(NIVEIS).map(function (k) {
        var v = niv[k] || { n: 0, ok: 0 };
        return "<div class='stat'><span class='meta'>" + esc(NIVEIS[k]) + "</span><b>" + v.ok + "/" + v.n + "</b></div>";
      }).join("");
      var acertos = ids.filter(function (k) { return r[k].ok; }).length;
      return "<div class='panel' style='margin-bottom:14px'><h3>" + esc(a.titulo) + " · " + esc(a.subtitulo) + "</h3>" +
        "<p class='meta'>" + ids.length + " respondidas · " + acertos + " corretas</p>" +
        "<div class='stats-grid'>" + linhas + "</div>" +
        "<div class='row' style='margin-top:12px'><a class='btn' href='#/aula/" + esc(a.id) + "/quiz'>Continuar quiz</a>" +
        "<button class='btn' data-zerar='" + esc(a.id) + "'>Zerar esta aula</button></div></div>";
    }).join("");
    app.innerHTML = "<h2 class='page'>Desempenho</h2><p class='sub'>Salvo neste navegador.</p>" + (blocos || "<p>Nenhuma aula disponível.</p>");
    var zs = document.querySelectorAll("[data-zerar]");
    for (var i = 0; i < zs.length; i++) {
      zs[i].onclick = function (ev) {
        if (!confirm("Apagar o histórico desta aula neste navegador?")) return;
        var id = ev.currentTarget.getAttribute("data-zerar");
        var atual = lerProgresso();
        delete atual[id];
        salvarProgresso(atual);
        paginaDesempenho();
      };
    }
  }

  // ---------- pasta: simulado e manobras ----------
  function renderManobrasResumo(M) {
    var byG = {};
    M.manobras.forEach(function (m) { (byG[m.grupo] = byG[m.grupo] || []).push(m); });
    return M.grupos.filter(function (g) { return byG[g.id]; }).map(function (g) {
      return "<h3>" + esc(g.titulo) + "</h3>" + byG[g.id].map(function (m) {
        return "<div class='panel' style='margin-bottom:10px'><h4>" + esc(m.nome) + "</h4>" +
          (m.epo ? "<p><span class='epo'>Epônimo: " + esc(m.epo) + "</span></p>" : "") +
          "<p><b>Como fazer:</b> " + esc(m.como) + "</p>" +
          "<p><b>Alterado:</b> " + esc(m.alterado) + "</p>" +
          "<p><b>Significado:</b> " + esc(m.significado) + "</p>" +
          "<p>" + linkSlide({ pdf: m.pdf }, m.slide, "Ver no slide " + m.slide + " do professor") +
          " <span class='note'>· " + esc(m.aula) + "</span></p></div>";
      }).join("");
    }).join("");
  }

  function desenhaQuizManobras() {
    var Q = (window.MANOBRAS && window.MANOBRAS.quiz) || [];
    var st = window.__mq;
    var box = document.getElementById("conteudo");
    if (!box || !st) return;
    if (st.i >= Q.length) {
      box.innerHTML = "<div class='panel'><h3>Fim do quiz</h3><p>" + st.ac + " de " + st.ft + " corretas.</p>" +
        "<button class='btn' id='mq-zerar'>Recomeçar</button></div>";
      document.getElementById("mq-zerar").onclick = function () { window.__mq = null; paginaManobras("quiz"); };
      return;
    }
    var q = Q[st.i];
    var resp = st.resp[st.i];
    var opts = q.alternativas.map(function (t, k) {
      var L = "ABCDE".charAt(k);
      var cls = "opt";
      if (resp !== undefined && L === q.gabarito) cls += " right";
      if (resp !== undefined && L === resp && L !== q.gabarito) cls += " wrong";
      return "<button class='" + cls + "' data-mq='" + L + "' " + (resp !== undefined ? "disabled" : "") + ">" +
        "<span class='l'>" + L + ")</span>" + esc(t) + "</button>";
    }).join("");
    var fb = resp === undefined ? "" :
      "<div class='feedback " + (resp === q.gabarito ? "ok" : "bad") + "'><div class='tag'>" +
      (resp === q.gabarito ? "Você acertou" : "Você errou. Gabarito: " + q.gabarito) + "</div>" +
      "<p>" + esc(q.justificativa) + "</p><p>" + linkSlide({ pdf: q.pdf }, q.slide, "Ver no slide " + q.slide + " do professor") + "</p></div>";
    box.innerHTML = "<p class='meta'>Questão " + (st.i + 1) + " de " + Q.length + " · acertos " + st.ac + "/" + st.ft + "</p>" +
      "<div class='qa mc'><div class='qtext'><b>" + (st.i + 1) + ".</b> " + esc(q.enunciado) + "</div>" +
      "<div class='opts'>" + opts + "</div>" + fb + "</div>" +
      "<div class='row' style='margin-top:14px;justify-content:space-between'>" +
      "<button class='btn' id='mq-ant' " + (st.i === 0 ? "disabled" : "") + ">&larr; Anterior</button>" +
      "<button class='btn primary' id='mq-prox'>Próxima &rarr;</button></div>";
    var bs = box.querySelectorAll("[data-mq]");
    for (var b = 0; b < bs.length; b++) {
      bs[b].onclick = function (ev) {
        var L = ev.currentTarget.getAttribute("data-mq");
        if (st.resp[st.i] !== undefined) return;
        st.resp[st.i] = L;
        st.ft++;
        if (L === Q[st.i].gabarito) st.ac++;
        desenhaQuizManobras();
      };
    }
    document.getElementById("mq-ant").onclick = function () { st.i = Math.max(0, st.i - 1); desenhaQuizManobras(); };
    document.getElementById("mq-prox").onclick = function () { st.i++; desenhaQuizManobras(); };
  }

  function paginaManobras(aba) {
    setTitle("Simulado de manobras");
    aba = aba || "manobras";
    var M = window.MANOBRAS || { grupos: [], manobras: [], quiz: [] };
    if (aba === "quiz" && (!window.__mq || window.__mq.len !== M.quiz.length)) {
      window.__mq = { i: 0, ac: 0, ft: 0, len: M.quiz.length, resp: {} };
    }
    var tabs = "<nav class='tabs' role='tablist'>" + [["manobras", "Resumo"], ["quiz", "Quiz de manobras"]].map(function (t) {
      return "<button role='tab' aria-selected='" + (t[0] === aba) + "' data-go='#/semiologia/manobras/" + t[0] + "'>" + t[1] + "</button>";
    }).join("") + "</nav>";
    var corpo;
    if (aba === "quiz") corpo = "<div id='quiz-mq'></div>";
    else corpo = renderManobrasResumo(M);
    app.innerHTML = "<div class='crumb'><a href='#/'>Início</a> / <a href='#/semiologia'>Semiologia</a> / Simulado de manobras</div>" +
      "<h2 class='page'>Simulado de manobras</h2><p class='sub'>Organizado da cabeça aos pés.</p>" + tabs +
      "<div id='conteudo'>" + corpo + "</div>";
    if (aba === "quiz") desenhaQuizManobras();
  }

  // ---------- roteamento ----------
  function rota() {
    var h = (location.hash || "#/").replace(/^#\/?/, "");
    var partes = h.split("/").filter(Boolean);
    window.scrollTo(0, 0);
    if (partes[0] === "aula" && partes[1]) {
      return paginaAula(partes[1], partes[2], partes[3]);
    }
    if (partes[0] === "desempenho") return paginaDesempenho();
    if (partes[0] === "semiologia" && partes[1] === "manobras") return paginaManobras(partes[2]);
    if (partes[0] === "semiologia") return paginaInicio();
    if (partes[0] === "agressao" && partes[1]) return paginaProfessorAgressao(partes[1]);
    if (partes[0] === "agressao") return paginaAgressao();
    return paginaHome();
  }

  window.addEventListener("hashchange", rota);
  document.addEventListener("click", function (ev) {
    var alvo = ev.target.closest && ev.target.closest("[data-go]");
    if (alvo) { location.hash = alvo.getAttribute("data-go").replace(/^#/, ""); return; }
    var link = ev.target.closest && ev.target.closest("a[href^='#']");
    if (link) {
      var href = link.getAttribute("href");
      if (href.indexOf("#/") === 0) return;
      var destino = document.getElementById(href.slice(1));
      if (destino) {
        ev.preventDefault();
        destino.scrollIntoView({ block: "start" });
      }
    }
  });
  rota();
})();
