'use strict';
/* =========================================================
   Componentes de interface: toast, modais, formulários, gráficos
   ========================================================= */

/* ---------- Toast ---------- */
function toast(msg, acao) {
  const t = $('#toast');
  t.innerHTML = `<span>${msg}</span>${acao ? `<button type="button" class="btn mini">${esc(acao.texto)}</button>` : ''}`;
  if (acao) t.querySelector('button').onclick = () => { t.classList.remove('visivel'); acao.fn(); };
  t.classList.add('visivel');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('visivel'), acao ? 7000 : 2800);
}

/* ---------- Modais (empilháveis) ---------- */
function abrirModal(titulo, corpoHTML) {
  const fundo = document.createElement('div');
  fundo.className = 'modal-fundo';
  fundo.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(titulo.replace(/<[^>]+>/g, ''))}">
      <header class="modal-topo">
        <h2>${titulo}</h2>
        <button type="button" class="icon-btn" data-fechar aria-label="Fechar">✕</button>
      </header>
      <div class="modal-corpo">${corpoHTML}</div>
    </div>`;
  fundo.addEventListener('mousedown', (e) => { fundo._clicouFora = e.target === fundo; });
  fundo.addEventListener('click', (e) => {
    if ((e.target === fundo && fundo._clicouFora) || e.target.closest('[data-fechar]')) fecharModal(fundo);
  });
  $('#modais').appendChild(fundo);
  document.body.classList.add('com-modal');
  setTimeout(() => {
    const f = fundo.querySelector('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]), textarea, select');
    if (f && window.matchMedia('(min-width: 700px)').matches) f.focus();
  }, 40);
  return fundo;
}
function fecharModal(fundo) {
  fundo = fundo || $('#modais').lastElementChild;
  if (fundo) {
    if (fundo._aoFechar) fundo._aoFechar();
    fundo.remove();
  }
  if (!$('#modais').children.length) document.body.classList.remove('com-modal');
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $('#modais').children.length) fecharModal();
});

function confirmar(msg, { botao = 'Confirmar', perigo = true, titulo = 'Tem certeza?' } = {}) {
  return new Promise((resolver) => {
    let respondido = false;
    const f = abrirModal(titulo, `
      <p>${msg}</p>
      <div class="form-acoes" style="margin-top:18px">
        <span class="espaco"></span>
        <button type="button" class="btn" data-r="0">Cancelar</button>
        <button type="button" class="btn ${perigo ? 'perigo' : 'primario'}" data-r="1">${botao}</button>
      </div>`);
    f._aoFechar = () => { if (!respondido) { respondido = true; resolver(false); } };
    f.addEventListener('click', (e) => {
      const b = e.target.closest('[data-r]');
      if (!b) return;
      respondido = true;
      resolver(b.dataset.r === '1');
      fecharModal(f);
    });
  });
}

/* ---------- Formulários ---------- */
function opcoesArea(opcional) {
  const ops = D.areas.map((a) => ({ value: a.id, label: `${a.icone} ${a.nome}` }));
  return opcional ? [{ value: '', label: '🌱 Geral' }, ...ops] : ops;
}

function campoHTML(c, valor) {
  const v = valor ?? c.padrao ?? '';
  const id = 'c_' + c.name;
  const req = c.required ? 'required' : '';
  const ph = c.placeholder ? `placeholder="${esc(c.placeholder)}"` : '';
  let input;
  switch (c.type) {
    case 'textarea':
      input = `<textarea id="${id}" name="${c.name}" rows="${c.rows || 3}" ${ph} ${req} maxlength="${c.maxlength || 4000}">${esc(v)}</textarea>`;
      break;
    case 'select':
    case 'area': {
      const ops = c.type === 'area' ? opcoesArea(c.opcional) : c.options;
      input = `<select id="${id}" name="${c.name}" ${req}>${ops.map((o) => `<option value="${esc(o.value)}" ${String(o.value) === String(v) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
      break;
    }
    case 'checkbox':
      return `<label class="campo check-campo ${c.full ? 'full' : ''}" data-campo="${c.name}"><input type="checkbox" name="${c.name}" ${v ? 'checked' : ''}><span>${c.label}</span></label>`;
    case 'humor':
      input = `<div class="escolha" role="radiogroup">${HUMORES.map((h) => `<label title="${h.t}"><input type="radio" name="${c.name}" value="${h.v}" ${Number(v) === h.v ? 'checked' : ''}><span>${h.e}</span></label>`).join('')}</div>`;
      break;
    case 'estrelas':
      input = `<div class="escolha estrelas" role="radiogroup">${[1, 2, 3, 4, 5].map((n) => `<label title="${n} estrela(s)"><input type="radio" name="${c.name}" value="${n}" ${Number(v) === n ? 'checked' : ''}><span>${'★'.repeat(n)}</span></label>`).join('')}</div>`;
      break;
    case 'imagem':
      input = `
        <input type="file" id="${id}" name="${c.name}" accept="image/*">
        <input type="hidden" name="${c.name}_atual" value="${esc(v)}">
        <img class="foto-preview" data-preview="${c.name}" src="${esc(v)}" alt="" ${v ? '' : 'hidden'}>
        ${v ? `<label class="check" style="margin-top:6px"><input type="checkbox" name="${c.name}_remover"><span>Remover foto</span></label>` : ''}`;
      break;
    default:
      input = `<input type="${c.type || 'text'}" id="${id}" name="${c.name}" value="${esc(v)}" ${ph} ${req}
        ${c.min !== undefined ? `min="${c.min}"` : ''} ${c.max !== undefined ? `max="${c.max}"` : ''}
        ${c.step ? `step="${c.step}"` : ''} maxlength="${c.maxlength || 300}" ${c.type === 'number' ? 'inputmode="decimal"' : ''}>`;
  }
  return `<label class="campo ${c.full ? 'full' : ''}" data-campo="${c.name}" ${c.type === 'humor' || c.type === 'estrelas' ? 'role="group"' : ''}>
    <span>${c.label}</span>${input}${c.dica ? `<small>${c.dica}</small>` : ''}</label>`;
}

async function coletar(form, campos) {
  const out = {};
  for (const c of campos) {
    const el = form.elements[c.name];
    if (c.type === 'checkbox') out[c.name] = !!(el && el.checked);
    else if (c.type === 'number') out[c.name] = el.value === '' ? null : Number(el.value);
    else if (c.type === 'humor' || c.type === 'estrelas') {
      const r = form.querySelector(`input[name="${c.name}"]:checked`);
      out[c.name] = r ? Number(r.value) : null;
    } else if (c.type === 'imagem') {
      const arquivo = el.files && el.files[0];
      const remover = form.elements[c.name + '_remover'];
      if (arquivo) {
        try { out[c.name] = await comprimirImagem(arquivo); }
        catch { toast('Não consegui ler essa imagem 😕'); out[c.name] = form.elements[c.name + '_atual'].value; }
      } else if (remover && remover.checked) out[c.name] = '';
      else out[c.name] = form.elements[c.name + '_atual'].value;
    } else out[c.name] = (el.value || '').trim();
  }
  return out;
}

/**
 * Abre um formulário em modal.
 * campos: [{ name, label, type, required, full, options, mostrarSe:{campo, valores} }]
 * aoSalvar(dados) -> retorne false para manter o modal aberto
 */
function formModal({ titulo, campos, valores = {}, aoSalvar, aoExcluir, botao = 'Salvar', intro = '' }) {
  const corpo = `
    ${intro ? `<p class="muted" style="margin-bottom:14px">${intro}</p>` : ''}
    <form class="form-grid">
      ${campos.map((c) => campoHTML(c, valores[c.name])).join('')}
      <div class="form-acoes">
        ${aoExcluir ? '<button type="button" class="btn perigo-texto" data-excluir>🗑 Excluir</button>' : ''}
        <span class="espaco"></span>
        <button type="button" class="btn" data-fechar>Cancelar</button>
        <button type="submit" class="btn primario">${botao}</button>
      </div>
    </form>`;
  const fundo = abrirModal(titulo, corpo);
  const form = fundo.querySelector('form');

  const atualizarVisiveis = () => {
    campos.forEach((c) => {
      if (!c.mostrarSe) return;
      const el = form.querySelector(`[data-campo="${c.name}"]`);
      const ctrl = form.elements[c.mostrarSe.campo];
      const atual = ctrl && ctrl.type === 'checkbox' ? (ctrl.checked ? 'on' : '') : ctrl?.value;
      el.hidden = !c.mostrarSe.valores.includes(atual);
    });
  };
  form.addEventListener('change', (e) => {
    atualizarVisiveis();
    if (e.target.type === 'file' && e.target.files[0]) {
      const prev = form.querySelector(`[data-preview="${e.target.name}"]`);
      if (prev) { prev.src = URL.createObjectURL(e.target.files[0]); prev.hidden = false; }
    }
  });
  atualizarVisiveis();

  let enviando = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (enviando) return;
    enviando = true;
    try {
      const dados = await coletar(form, campos);
      if (aoSalvar(dados) === false) return;
      salvar();
      fecharModal(fundo);
      renderizar();
    } finally { enviando = false; }
  });

  if (aoExcluir) {
    fundo.querySelector('[data-excluir]').addEventListener('click', async () => {
      if (await confirmar('Esse item será excluído permanentemente.', { botao: 'Excluir' })) {
        aoExcluir();
        salvar();
        fecharModal(fundo);
        renderizar();
        toast('Excluído');
      }
    });
  }
  return fundo;
}

/* ---------- Pequenos componentes ---------- */
function barra(p, cor) {
  return `<div class="barra ${cor ? 'cor' : ''}" ${cor ? `style="--cor:${cor}"` : ''} role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><span style="width:${Math.max(0, Math.min(100, p))}%"></span></div>`;
}
function chipArea(a) {
  return `<span class="chip" style="--cor:${a.cor}" title="${esc(a.nome)}">${a.icone} ${esc(a.nome)}</span>`;
}
function vazio(icone, texto, botao = '') {
  return `<div class="vazio"><span class="vazio-icone">${icone}</span>${texto}${botao ? `<div>${botao}</div>` : ''}</div>`;
}
function estrelas(n) {
  return n ? `<span class="estrelas-txt" aria-label="${n} de 5 estrelas">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>` : '';
}
function stat(icone, valor, rotulo) {
  return `<div class="stat"><span class="stat-icone">${icone}</span><span class="stat-valor">${valor}</span><span class="stat-rotulo">${rotulo}</span></div>`;
}
function abas(chave, itens) {
  return `<div class="tabs" role="tablist">${itens.map(([v, rotulo]) => `<button type="button" role="tab" class="tab ${estado[chave] === v ? 'ativo' : ''}" aria-selected="${estado[chave] === v}" data-acao="estado" data-chave="${chave}" data-valor="${v}">${rotulo}</button>`).join('')}</div>`;
}
function filtrosArea(chave) {
  const atual = estado[chave];
  return `<div class="filtros">
    <button type="button" class="filtro ${atual === 'todas' ? 'ativo' : ''}" data-acao="estado" data-chave="${chave}" data-valor="todas">Todas</button>
    ${D.areas.map((a) => `<button type="button" class="filtro ${atual === a.id ? 'ativo' : ''}" data-acao="estado" data-chave="${chave}" data-valor="${a.id}">${a.icone} ${esc(a.nome)}</button>`).join('')}
  </div>`;
}

/* ---------- Gráficos ---------- */
function radarSVG(series, tam = 360) {
  const as = D.areas;
  const n = as.length;
  const c = tam / 2;
  const r = c - 62;
  const ponto = (i, v) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [c + Math.cos(ang) * (r * v) / 10, c + Math.sin(ang) * (r * v) / 10];
  };
  let s = `<svg class="radar" viewBox="0 0 ${tam} ${tam}" role="img" aria-label="Roda da vida">`;
  for (const k of [2, 4, 6, 8, 10]) {
    s += `<polygon class="radar-anel" points="${as.map((_, i) => ponto(i, k).map((x) => x.toFixed(1)).join(',')).join(' ')}"/>`;
  }
  as.forEach((_, i) => {
    const [x, y] = ponto(i, 10);
    s += `<line class="radar-eixo" x1="${c}" y1="${c}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
  });
  series.forEach((se) => {
    const vals = as.map((a) => se.valor(a) || 0);
    if (!vals.some(Boolean)) return;
    s += `<polygon class="radar-serie ${se.classe}" points="${vals.map((v, i) => ponto(i, v).map((x) => x.toFixed(1)).join(',')).join(' ')}"/>`;
    vals.forEach((v, i) => {
      if (!v) return;
      const [x, y] = ponto(i, v);
      s += `<circle class="radar-ponto ${se.classe}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5"><title>${esc(as[i].nome)}: ${v}</title></circle>`;
    });
  });
  const principal = series[series.length - 1];
  as.forEach((a, i) => {
    const [x, y] = ponto(i, 12.9);
    const v = principal.valor(a);
    s += `<g><title>${esc(a.nome)}</title><text x="${x.toFixed(1)}" y="${(y - 3).toFixed(1)}" text-anchor="middle" class="radar-icone">${a.icone}</text>
      <text x="${x.toFixed(1)}" y="${(y + 14).toFixed(1)}" text-anchor="middle" class="radar-valor">${v || '–'}</text></g>`;
  });
  return s + '</svg>';
}

function legendaRadar() {
  return `<div class="legenda"><span><i style="background:var(--accent)"></i>Ponto de partida</span><span><i style="background:var(--primary)"></i>Nota mais recente</span></div>`;
}

function sparkline(pontos, { max = 10 } = {}) {
  // pontos: [{rotulo, valor}]
  const w = 320, h = 80, pad = 12;
  const passo = (w - pad * 2) / Math.max(1, pontos.length - 1);
  const y = (v) => h - 16 - ((h - 26) * v) / max;
  const validos = pontos.map((p, i) => ({ ...p, x: pad + i * passo })).filter((p) => p.valor);
  let s = `<svg class="sparkline" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Evolução das notas">`;
  s += `<line class="linha-base" x1="${pad}" x2="${w - pad}" y1="${y(5)}" y2="${y(5)}"/>`;
  if (validos.length > 1) s += `<polyline points="${validos.map((p) => `${p.x.toFixed(1)},${y(p.valor).toFixed(1)}`).join(' ')}"/>`;
  validos.forEach((p) => { s += `<circle cx="${p.x.toFixed(1)}" cy="${y(p.valor).toFixed(1)}" r="3.5"><title>${p.rotulo}: ${p.valor}</title></circle>`; });
  pontos.forEach((p, i) => { if (i % 2 === 0) s += `<text x="${(pad + i * passo).toFixed(1)}" y="${h - 2}" text-anchor="middle">${p.rotulo}</text>`; });
  return s + '</svg>';
}
