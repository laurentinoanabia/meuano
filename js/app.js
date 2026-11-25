'use strict';
/* =========================================================
   App: navegação, tema, ações e formulários
   ========================================================= */

const NAV = [
  { grupo: 'Meu ano', itens: [
    ['inicio', '🏠', 'Início'],
    ['areas', '🌸', 'Áreas da vida'],
    ['metas', '🎯', 'Metas e objetivos'],
    ['habitos', '🔁', 'Hábitos'],
    ['feitos', '🏆', 'Mural de feitos'],
    ['revisoes', '📝', 'Revisões'],
    ['retrospectiva', '🎞️', 'Retrospectiva'],
  ] },
  { grupo: 'Extras', itens: [
    ['financas', '💸', 'Finanças'],
    ['listas', '📖', 'Livros, filmes e viagens'],
    ['desejos', '🌈', 'Lista da vida'],
    ['diario', '📔', 'Diário'],
  ] },
  { grupo: '', itens: [['config', '⚙️', 'Configurações']] },
];

function montarNav() {
  $('#nav').innerHTML = NAV.map((g) => `
    <div class="nav-grupo">
      ${g.grupo ? `<div class="nav-grupo-titulo">${g.grupo}</div>` : ''}
      ${g.itens.map(([r, i, t]) => `<a class="nav-link" href="#${r}" data-rota="${r}"><span class="nav-icone">${i}</span>${t}</a>`).join('')}
    </div>`).join('');
}

/* ---------- Tema ---------- */
const mqEscuro = window.matchMedia('(prefers-color-scheme: dark)');
function aplicarTema() {
  const html = document.documentElement;
  html.dataset.paleta = D.config.paleta === 'rosa' ? 'rosa' : 'lilas';
  const temaHost = html.dataset.theme; // definido por alguns visualizadores (claro/escuro)
  const autoEscuro = temaHost === 'dark' ? true : temaHost === 'light' ? false : mqEscuro.matches;
  const escuro = D.config.modo === 'escuro' || (D.config.modo === 'auto' && autoEscuro);
  html.dataset.escuro = escuro ? '1' : '0';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = escuro ? (html.dataset.paleta === 'rosa' ? '#211720' : '#1b1625') : (html.dataset.paleta === 'rosa' ? '#f3b6cd' : '#b39ae6');
}
mqEscuro.addEventListener?.('change', () => { if (D.config.modo === 'auto') aplicarTema(); });

/* ---------- Roteamento ---------- */
let rotaAnterior = null;
function renderizar() {
  // Rotas: #inicio, #metas, #area-saude (aceita também o formato antigo #/area/saude)
  const bruto = location.hash.replace(/^#\/?/, '');
  const partes = bruto.startsWith('area-') ? ['area', bruto.slice(5)] : bruto.split('/');
  const nome = VIEWS[partes[0]] ? partes[0] : 'inicio';
  const main = $('#main');
  try {
    main.innerHTML = VIEWS[nome](...partes.slice(1).map(decodeURIComponent));
  } catch (e) {
    console.error(e);
    main.innerHTML = vazio('😵', 'Algo deu errado ao mostrar esta página.', '<a class="btn" href="#inicio">Voltar ao início</a>');
  }
  const rotaNav = nome === 'area' ? 'areas' : nome;
  $$('.nav-link').forEach((a) => {
    const ativo = a.dataset.rota === rotaNav;
    a.classList.toggle('ativo', ativo);
    if (ativo) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  if (location.hash !== rotaAnterior) {
    if (rotaAnterior !== null) { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
    rotaAnterior = location.hash;
    $('#app').classList.remove('menu-aberto');
    const item = NAV.flatMap((g) => g.itens).find(([r]) => r === rotaNav);
    document.title = item && nome !== 'inicio' ? `${item[2]} · Meu Ano 2027` : 'Meu Ano 2027';
    if (nome === 'habitos') rolarParaHoje();
  }
}
window.addEventListener('hashchange', renderizar);

function rolarParaHoje() {
  const caixa = $('.rolagem-x');
  const col = $('.hab-tabela th.hoje-col');
  if (caixa && col) caixa.scrollLeft = Math.max(0, col.offsetLeft - caixa.clientWidth + 80);
}

function mudou() { salvar(); renderizar(); }

/* ---------- Formulários de cada entidade ---------- */
function abrirMeta(m, areaId) {
  const campos = [
    { name: 'titulo', label: 'Meta', required: true, full: true, placeholder: 'Ex.: Correr uma meia maratona' },
    { name: 'areaId', label: 'Área da vida', type: 'area', padrao: areaId || D.areas[0].id },
    { name: 'prazo', label: 'Prazo', type: 'date', padrao: `${ANO}-12-31` },
    { name: 'descricao', label: 'Por que isso importa para mim?', type: 'textarea', full: true, rows: 2 },
    { name: 'tipo', label: 'Como medir o progresso', type: 'select', full: true, padrao: 'numerica', options: [
      { value: 'numerica', label: '🔢 Por número (ex.: 24 livros, R$ 10.000)' },
      { value: 'etapas', label: '✅ Por etapas (checklist)' },
      { value: 'simples', label: '☑️ Feito ou não feito' },
    ] },
    { name: 'atual', label: 'Valor atual', type: 'number', step: 'any', padrao: 0, mostrarSe: { campo: 'tipo', valores: ['numerica'] } },
    { name: 'alvo', label: 'Valor alvo', type: 'number', step: 'any', min: 0, mostrarSe: { campo: 'tipo', valores: ['numerica'] } },
    { name: 'unidade', label: 'Unidade', placeholder: 'livros, km, R$…', dica: 'Use “R$” para formatar como dinheiro.', mostrarSe: { campo: 'tipo', valores: ['numerica'] } },
    { name: 'passo', label: 'Quanto soma cada toque no +', type: 'number', step: 'any', min: 0, padrao: 1, mostrarSe: { campo: 'tipo', valores: ['numerica'] } },
    { name: 'etapasTexto', label: 'Etapas (uma por linha)', type: 'textarea', full: true, rows: 5, placeholder: 'Pesquisar\nComeçar\nTerminar', mostrarSe: { campo: 'tipo', valores: ['etapas'] } },
  ];
  const valores = m ? { ...m, etapasTexto: (m.etapas || []).map((e) => e.texto).join('\n') } : {};
  formModal({
    titulo: m ? 'Editar meta' : '🎯 Nova meta',
    intro: m ? '' : 'Dica: metas boas são específicas e mensuráveis. “Ler 24 livros” é melhor que “ler mais”.',
    campos, valores,
    aoSalvar: (d) => {
      if (d.tipo === 'numerica' && !(d.alvo > 0)) { toast('Informe um valor alvo maior que zero'); return false; }
      const antes = m ? progressoMeta(m) : 0;
      const anteriores = m ? m.etapas || [] : [];
      const etapas = d.etapasTexto.split('\n').map((s) => s.trim()).filter(Boolean).map((t) => {
        const ex = anteriores.find((e) => e.texto === t);
        return { id: ex ? ex.id : uid(), texto: t, feito: ex ? ex.feito : false };
      });
      if (d.tipo === 'etapas' && !etapas.length) { toast('Adicione pelo menos uma etapa'); return false; }
      const obj = { titulo: d.titulo, areaId: d.areaId, prazo: d.prazo, descricao: d.descricao, tipo: d.tipo, unidade: d.unidade, atual: d.atual || 0, alvo: d.alvo || 0, passo: d.passo || 1, etapas };
      if (m) Object.assign(m, obj);
      else D.metas.push({ id: uid(), criadoEm: hojeISO(), concluida: false, ...obj });
      if (m) setTimeout(() => celebrarSeConcluiu(m, antes));
    },
    aoExcluir: m ? () => {
      D.metas = D.metas.filter((x) => x !== m);
      D.objetivos.forEach((o) => { if (o.metaId === m.id) o.metaId = ''; });
    } : null,
  });
}

function celebrarSeConcluiu(m, antes) {
  if (antes < 100 && progressoMeta(m) >= 100) {
    toast(`🎉 Meta concluída: ${esc(m.titulo)}!`, {
      texto: 'Levar ao mural',
      fn: () => {
        D.feitos.push({ id: uid(), titulo: `Concluí a meta: ${m.titulo}`, data: hojeISO(), areaId: m.areaId, descricao: m.descricao || '', foto: '' });
        mudou();
        toast('🏆 Adicionado ao mural de feitos!');
      },
    });
  }
}

function abrirObjetivo(o, tri) {
  formModal({
    titulo: o ? 'Editar objetivo' : '🗓️ Novo objetivo trimestral',
    campos: [
      { name: 'titulo', label: 'Objetivo', required: true, full: true, placeholder: 'Ex.: Ler 6 livros' },
      { name: 'trimestre', label: 'Trimestre', type: 'select', padrao: String(tri || trimestreAtual()), options: [1, 2, 3, 4].map((t) => ({ value: String(t), label: `${t}º trimestre` })) },
      { name: 'metaId', label: 'Ligado à meta', type: 'select', options: [{ value: '', label: '— Nenhuma —' }, ...D.metas.map((m) => ({ value: m.id, label: m.titulo }))] },
      { name: 'areaId', label: 'Área (se não houver meta)', type: 'area', opcional: true },
      { name: 'feito', label: 'Concluído', type: 'checkbox' },
    ],
    valores: o ? { ...o, trimestre: String(o.trimestre) } : {},
    aoSalvar: (d) => {
      const meta = D.metas.find((m) => m.id === d.metaId);
      const obj = { titulo: d.titulo, trimestre: Number(d.trimestre), metaId: d.metaId, areaId: meta ? meta.areaId : d.areaId, feito: d.feito };
      if (o) Object.assign(o, obj); else D.objetivos.push({ id: uid(), ...obj });
    },
    aoExcluir: o ? () => { D.objetivos = D.objetivos.filter((x) => x !== o); } : null,
  });
}

function abrirHabito(h, areaId) {
  formModal({
    titulo: h ? 'Editar hábito' : '🔁 Novo hábito',
    intro: h ? '' : 'Comece pequeno: “ler 10 minutos” é mais sustentável que “ler 1 hora”.',
    campos: [
      { name: 'nome', label: 'Hábito', required: true, full: true, placeholder: 'Ex.: Beber 2 L de água' },
      { name: 'icone', label: 'Emoji', placeholder: '💧', maxlength: 8, padrao: '⭐' },
      { name: 'areaId', label: 'Área da vida', type: 'area', padrao: areaId || D.areas[0].id },
      { name: 'metaSemanal', label: 'Quantas vezes por semana?', type: 'number', min: 1, max: 7, step: 1, padrao: 7 },
    ],
    valores: h || {},
    aoSalvar: (d) => {
      const obj = { nome: d.nome, icone: d.icone, areaId: d.areaId, metaSemanal: Math.min(7, Math.max(1, d.metaSemanal || 7)) };
      if (h) Object.assign(h, obj); else D.habitos.push({ id: uid(), registros: {}, ...obj });
    },
    aoExcluir: h ? () => { D.habitos = D.habitos.filter((x) => x !== h); } : null,
  });
}

function abrirFeito(f, areaId, extra = {}) {
  formModal({
    titulo: f ? 'Editar feito' : '🏆 Registrar feito',
    campos: [
      { name: 'titulo', label: 'O que você conquistou ou viveu?', required: true, full: true },
      { name: 'data', label: 'Data', type: 'date', required: true, padrao: hojeISO() },
      { name: 'areaId', label: 'Área da vida', type: 'area', opcional: true, padrao: areaId || '' },
      { name: 'descricao', label: 'Conte mais (como se sentiu, quem estava junto…)', type: 'textarea', full: true },
      { name: 'foto', label: 'Foto (opcional)', type: 'imagem', full: true },
    ],
    valores: f || extra,
    aoSalvar: (d) => {
      if (f) Object.assign(f, d);
      else { D.feitos.push({ id: uid(), ...d }); setTimeout(() => toast('🏆 Feito registrado! Parabéns!')); }
    },
    aoExcluir: f ? () => { D.feitos = D.feitos.filter((x) => x !== f); } : null,
  });
}

function abrirRevisao(tipo, r) {
  const cfg = REVISOES[tipo];
  const campos = cfg.campos();
  let valores = r ? { ...r } : {};
  if (tipo === 'mensal') {
    const mes = r ? r.mes : mesAtualAno();
    valores.mes = String(mes);
    D.areas.forEach((a) => { if (valores['nota_' + a.id] == null && a.notas[mesKey(mes)]) valores['nota_' + a.id] = a.notas[mesKey(mes)]; });
  }
  if (tipo === 'trimestral' && r) valores.trimestre = String(r.trimestre);
  formModal({
    titulo: `${cfg.icone} Revisão ${cfg.rotulo.toLowerCase()}`,
    campos, valores,
    aoSalvar: (d) => {
      if (tipo === 'mensal') {
        d.mes = Number(d.mes);
        D.areas.forEach((a) => {
          const v = d['nota_' + a.id];
          if (v != null) {
            d['nota_' + a.id] = Math.min(10, Math.max(1, Math.round(v)));
            a.notas[mesKey(d.mes)] = d['nota_' + a.id];
          }
        });
      }
      if (tipo === 'trimestral') d.trimestre = Number(d.trimestre);
      if (r) Object.assign(r, d); else D.revisoes[tipo].push({ id: uid(), criadoEm: hojeISO(), ...d });
    },
    aoExcluir: r ? () => { D.revisoes[tipo] = D.revisoes[tipo].filter((x) => x !== r); } : null,
  });
}

function abrirLancamento(l) {
  const m = estado.finMes || mesAtualAno();
  formModal({
    titulo: l ? 'Editar lançamento' : '💸 Novo lançamento',
    campos: [
      { name: 'tipo', label: 'Tipo', type: 'select', padrao: 'despesa', options: [{ value: 'despesa', label: '↑ Despesa' }, { value: 'receita', label: '↓ Receita' }] },
      { name: 'valor', label: 'Valor (R$)', type: 'number', step: '0.01', min: 0, required: true },
      { name: 'descricao', label: 'Descrição', full: true, placeholder: 'Ex.: Mercado do mês' },
      { name: 'catDespesa', label: 'Categoria', type: 'select', options: CATEGORIAS_DESPESA.map((c) => ({ value: c, label: c })), mostrarSe: { campo: 'tipo', valores: ['despesa'] } },
      { name: 'catReceita', label: 'Categoria', type: 'select', options: CATEGORIAS_RECEITA.map((c) => ({ value: c, label: c })), mostrarSe: { campo: 'tipo', valores: ['receita'] } },
      { name: 'mes', label: 'Mês', type: 'select', options: MESES.map((n, i) => ({ value: String(i + 1), label: n })) },
      ...(l ? [] : [{ name: 'repetir', label: 'Repetir até dezembro (gasto ou receita fixa)', type: 'checkbox', full: true }]),
    ],
    valores: l ? { ...l, catDespesa: l.categoria, catReceita: l.categoria, mes: String(Number(l.mes.slice(5))) } : { mes: String(m) },
    aoSalvar: (d) => {
      if (!(d.valor > 0)) { toast('Informe um valor maior que zero'); return false; }
      const base = { tipo: d.tipo, valor: d.valor, descricao: d.descricao, categoria: d.tipo === 'receita' ? d.catReceita : d.catDespesa };
      const mesN = Number(d.mes);
      if (l) Object.assign(l, base, { mes: mesKey(mesN) });
      else {
        const ate = d.repetir ? 12 : mesN;
        for (let i = mesN; i <= ate; i++) D.financas.lancamentos.push({ id: uid(), ...base, mes: mesKey(i) });
      }
    },
    aoExcluir: l ? () => { D.financas.lancamentos = D.financas.lancamentos.filter((x) => x !== l); } : null,
  });
}

function abrirLimites() {
  formModal({
    titulo: '⚙️ Limites mensais por categoria',
    intro: 'Defina quanto quer gastar no máximo por mês em cada categoria. Deixe em branco para não ter limite.',
    campos: CATEGORIAS_DESPESA.map((c) => ({ name: c, label: c, type: 'number', step: '0.01', min: 0, placeholder: 'sem limite' })),
    valores: D.financas.limites,
    aoSalvar: (d) => {
      const lim = {};
      Object.entries(d).forEach(([k, v]) => { if (v > 0) lim[k] = v; });
      D.financas.limites = lim;
    },
  });
}

function abrirCaixinha(c) {
  formModal({
    titulo: c ? 'Editar caixinha' : '🐷 Nova caixinha',
    campos: [
      { name: 'nome', label: 'Nome', required: true, placeholder: 'Ex.: Reserva de emergência' },
      { name: 'icone', label: 'Emoji', maxlength: 8, padrao: '🐷' },
      { name: 'alvo', label: 'Quanto quer juntar (R$)', type: 'number', step: '0.01', min: 0, required: true },
      { name: 'atual', label: 'Quanto já tem (R$)', type: 'number', step: '0.01', min: 0, padrao: 0 },
      { name: 'prazo', label: 'Prazo', type: 'date' },
    ],
    valores: c || {},
    aoSalvar: (d) => {
      const obj = { ...d, alvo: d.alvo || 0, atual: d.atual || 0 };
      if (c) Object.assign(c, obj); else D.financas.caixinhas.push({ id: uid(), ...obj });
    },
    aoExcluir: c ? () => { D.financas.caixinhas = D.financas.caixinhas.filter((x) => x !== c); } : null,
  });
}

function abrirDeposito(c) {
  formModal({
    titulo: `${esc(c.icone || '🐷')} ${esc(c.nome)}`,
    intro: `Saldo atual: <strong>${fmtDinheiro(c.atual)}</strong>`,
    botao: 'Confirmar',
    campos: [
      { name: 'operacao', label: 'Operação', type: 'select', options: [{ value: 'dep', label: '➕ Depositar' }, { value: 'ret', label: '➖ Retirar' }] },
      { name: 'valor', label: 'Valor (R$)', type: 'number', step: '0.01', min: 0, required: true },
    ],
    aoSalvar: (d) => {
      if (!(d.valor > 0)) { toast('Informe um valor'); return false; }
      const antes = pct(c.atual, c.alvo);
      c.atual = Math.max(0, (Number(c.atual) || 0) + (d.operacao === 'ret' ? -d.valor : d.valor));
      if (antes < 100 && pct(c.atual, c.alvo) >= 100) setTimeout(() => toast(`🎉 Caixinha “${esc(c.nome)}” completa!`));
    },
  });
}

function abrirItemLista(lista, item) {
  const cfg = LISTAS[lista];
  formModal({
    titulo: item ? 'Editar' : `Adicionar ${cfg.item}`,
    campos: [
      { name: 'titulo', label: cfg.campoTitulo, required: true, full: true },
      { name: 'sub', label: cfg.campoSub, full: true },
      { name: 'status', label: 'Status', type: 'select', options: cfg.status.map(([v, r]) => ({ value: v, label: r })) },
      { name: 'data', label: 'Data de conclusão', type: 'date', mostrarSe: { campo: 'status', valores: ['concluido'] } },
      { name: 'nota', label: 'Avaliação', type: 'estrelas', full: true },
      { name: 'comentario', label: 'Comentário', type: 'textarea', full: true, rows: 2 },
    ],
    valores: item || {},
    aoSalvar: (d) => {
      if (d.status === 'concluido' && !d.data) d.data = hojeISO();
      if (item) Object.assign(item, d); else D.listas[lista].push({ id: uid(), ...d });
    },
    aoExcluir: item ? () => { D.listas[lista] = D.listas[lista].filter((x) => x !== item); } : null,
  });
}

function abrirDesejo(d, areaId) {
  formModal({
    titulo: d ? 'Editar sonho' : '🌈 Novo sonho',
    campos: [
      { name: 'texto', label: 'Sonho ou experiência', required: true, full: true, placeholder: 'Ex.: Ver a aurora boreal' },
      { name: 'areaId', label: 'Área da vida', type: 'area', opcional: true, padrao: areaId || '' },
      { name: 'feito', label: 'Já realizei! 🎉', type: 'checkbox' },
      { name: 'dataFeito', label: 'Quando realizou', type: 'date', mostrarSe: { campo: 'feito', valores: ['on'] } },
    ],
    valores: d || {},
    aoSalvar: (x) => {
      if (x.feito && !x.dataFeito) x.dataFeito = hojeISO();
      if (!x.feito) x.dataFeito = '';
      if (d) Object.assign(d, x); else D.desejos.push({ id: uid(), ...x });
    },
    aoExcluir: d ? () => { D.desejos = D.desejos.filter((y) => y !== d); } : null,
  });
}

function abrirDiario(e, dia) {
  formModal({
    titulo: e ? 'Editar registro' : '📔 Novo registro',
    campos: [
      { name: 'data', label: 'Data', type: 'date', required: true, padrao: dia || hojeISO() },
      { name: 'humor', label: 'Como você está?', type: 'humor', full: true },
      { name: 'texto', label: 'Escreva livremente', type: 'textarea', full: true, rows: 6, maxlength: 10000 },
      { name: 'gratidao', label: 'Algo pelo qual agradeço hoje 🙏', type: 'textarea', full: true, rows: 2 },
    ],
    valores: e || {},
    aoSalvar: (d) => { if (e) Object.assign(e, d); else D.diario.push({ id: uid(), ...d }); },
    aoExcluir: e ? () => { D.diario = D.diario.filter((x) => x !== e); } : null,
  });
}

function abrirArea(a) {
  formModal({
    titulo: 'Editar área',
    campos: [
      { name: 'nome', label: 'Nome', required: true, full: true },
      { name: 'icone', label: 'Emoji', maxlength: 8, required: true },
      { name: 'cor', label: 'Cor', type: 'color' },
    ],
    valores: a,
    aoSalvar: (d) => { Object.assign(a, d); },
  });
}

function boasVindas() {
  formModal({
    titulo: '🌸 Boas-vindas ao seu 2027!',
    intro: 'Este é o seu espaço para organizar todas as áreas da vida: metas, hábitos, conquistas e muito mais. Vamos começar?',
    botao: 'Começar ✨',
    campos: [
      { name: 'nome', label: 'Seu nome ou apelido', maxlength: 60 },
      { name: 'palavra', label: 'Palavra do ano (opcional)', placeholder: 'Ex.: Constância', maxlength: 40 },
      { name: 'paleta', label: 'Cor do tema', type: 'select', options: [{ value: 'lilas', label: '💜 Lilás' }, { value: 'rosa', label: '🩷 Rosa bebê' }] },
      { name: 'exemplos', label: 'Começar com exemplos de metas, hábitos e objetivos (você pode editar ou apagar depois)', type: 'checkbox', full: true },
    ],
    valores: { paleta: D.config.paleta, exemplos: true },
    aoSalvar: (d) => {
      D.config.nome = d.nome;
      if (d.palavra) D.config.palavra = d.palavra;
      D.config.paleta = d.paleta;
      if (d.exemplos) carregarExemplos();
      aplicarTema();
    },
  });
}

/* ---------- Backup ---------- */
function exportar() {
  D.config.ultimoBackup = hojeISO();
  salvar();
  const blob = new Blob([JSON.stringify(D, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meuano2027-backup-${hojeISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  renderizar();
  mostrarBackupTexto();
}

// Alguns lugares (como o visualizador do Claude) bloqueiam downloads.
// Por isso o backup também aparece como texto para copiar e guardar.
function mostrarBackupTexto() {
  const texto = JSON.stringify(D);
  const f = abrirModal('💾 Seu backup', `
    <p class="muted" style="margin-bottom:12px">Se o arquivo não baixou, copie o texto abaixo e guarde em um lugar seguro (um e-mail para você mesmo, uma nota, o Google Drive…). Para restaurar, use <strong>Importar backup → Colar texto</strong>.</p>
    <textarea id="backup-texto" rows="8" readonly style="font-family:monospace;font-size:12px">${esc(texto)}</textarea>
    <div class="form-acoes" style="margin-top:12px"><span class="espaco"></span>
      <button type="button" class="btn" data-fechar>Fechar</button>
      <button type="button" class="btn primario" id="copiar-backup">📋 Copiar</button>
    </div>`);
  f.querySelector('#copiar-backup').addEventListener('click', () => {
    const ta = f.querySelector('#backup-texto');
    const ok = () => toast('📋 Backup copiado!');
    try {
      navigator.clipboard.writeText(texto).then(ok).catch(() => { ta.select(); toast('Texto selecionado: use Copiar do seu aparelho'); });
    } catch { ta.select(); toast('Texto selecionado: use Copiar do seu aparelho'); }
  });
}

async function restaurarDe(textoJSON) {
  try {
    const dados = JSON.parse(textoJSON);
    if (!dados || !Array.isArray(dados.areas) || !dados.config) throw new Error('formato');
    if (!(await confirmar('Importar este backup vai <strong>substituir</strong> todos os dados atuais deste navegador.', { botao: 'Importar' }))) return false;
    D = mesclarPadrao(dadosPadrao(), dados);
    D.config.boasVindas = true;
    salvar();
    aplicarTema();
    renderizar();
    toast('✅ Backup importado!');
    return true;
  } catch (e) {
    console.error(e);
    toast('⚠️ Backup inválido. Use um backup exportado por este site.');
    return false;
  }
}

function importar() {
  const f = abrirModal('⬆️ Importar backup', `
    <p class="muted" style="margin-bottom:12px">Escolha o arquivo .json do backup ou cole o texto copiado.</p>
    <div class="pilha" style="gap:12px">
      <label class="campo"><span>Arquivo de backup</span><input type="file" id="imp-arquivo" accept=".json,application/json"></label>
      <label class="campo"><span>Ou cole o texto aqui</span><textarea id="imp-texto" rows="5" style="font-family:monospace;font-size:12px"></textarea></label>
    </div>
    <div class="form-acoes" style="margin-top:12px"><span class="espaco"></span>
      <button type="button" class="btn" data-fechar>Cancelar</button>
      <button type="button" class="btn primario" id="imp-ok">Importar</button>
    </div>`);
  f.querySelector('#imp-ok').addEventListener('click', async () => {
    const arq = f.querySelector('#imp-arquivo').files[0];
    const texto = arq ? await arq.text() : f.querySelector('#imp-texto').value.trim();
    if (!texto) { toast('Escolha um arquivo ou cole o texto do backup'); return; }
    if (await restaurarDe(texto)) fecharModal(f);
  });
}

/* ---------- Ações (cliques) ---------- */
const achar = (lista, id) => lista.find((x) => x.id === id);

const ACOES = {
  menu: () => $('#app').classList.toggle('menu-aberto'),
  alternarModo: () => {
    const escuro = document.documentElement.dataset.escuro === '1';
    D.config.modo = escuro ? 'claro' : 'escuro';
    salvar(); aplicarTema();
    if (location.hash.includes('config')) renderizar();
  },
  estado: (ds) => { estado[ds.chave] = ds.valor; renderizar(); },
  irTrimestres: () => { estado.metasAba = 'tri'; location.hash = '#metas'; renderizar(); },

  novaMeta: (ds) => abrirMeta(null, ds.area),
  editarMeta: (ds) => abrirMeta(achar(D.metas, ds.id)),
  metaMais: (ds) => ajustarMeta(ds.id, 1),
  metaMenos: (ds) => ajustarMeta(ds.id, -1),

  novoObjetivo: (ds) => abrirObjetivo(null, Number(ds.tri) || null),
  editarObjetivo: (ds) => abrirObjetivo(achar(D.objetivos, ds.id)),

  novoHabito: (ds) => abrirHabito(null, ds.area),
  editarHabito: (ds) => abrirHabito(achar(D.habitos, ds.id)),
  toggleHabito: (ds) => {
    const h = achar(D.habitos, ds.id);
    if (!h || ds.dia > hojeISO()) return;
    if (h.registros[ds.dia]) delete h.registros[ds.dia]; else h.registros[ds.dia] = true;
    mudou();
    const seq = sequenciaAtual(h);
    if (h.registros[ds.dia] && [7, 21, 30, 66, 100, 365].includes(seq)) toast(`🔥 ${seq} dias seguidos de “${esc(h.nome)}”!`);
  },
  habMes: (ds) => {
    const d = Number(ds.delta);
    const agora = new Date();
    if (!d) estado.habMes = { ano: agora.getFullYear(), mes: agora.getMonth() };
    else {
      const x = new Date(estado.habMes.ano, estado.habMes.mes + d, 1);
      estado.habMes = { ano: x.getFullYear(), mes: x.getMonth() };
    }
    renderizar();
    rolarParaHoje();
  },

  novoFeito: (ds) => abrirFeito(null, ds.area),
  editarFeito: (ds) => abrirFeito(achar(D.feitos, ds.id)),

  removerFoco: (ds) => { D.foco = D.foco.filter((f) => f.id !== ds.id); mudou(); },

  novaRevisao: (ds) => abrirRevisao(ds.tipo),
  editarRevisao: (ds) => abrirRevisao(ds.tipo, achar(D.revisoes[ds.tipo], ds.id)),

  finMes: (ds) => { estado.finMes = Math.min(12, Math.max(1, (estado.finMes || mesAtualAno()) + Number(ds.delta))); renderizar(); },
  novoLancamento: () => abrirLancamento(),
  editarLancamento: (ds) => abrirLancamento(achar(D.financas.lancamentos, ds.id)),
  editarLimites: () => abrirLimites(),
  novaCaixinha: () => abrirCaixinha(),
  editarCaixinha: (ds) => abrirCaixinha(achar(D.financas.caixinhas, ds.id)),
  depositar: (ds) => abrirDeposito(achar(D.financas.caixinhas, ds.id)),

  novoItemLista: (ds) => abrirItemLista(ds.lista),
  editarItemLista: (ds) => abrirItemLista(ds.lista, achar(D.listas[ds.lista], ds.id)),

  novoDesejo: (ds) => abrirDesejo(null, ds.area),
  editarDesejo: (ds) => abrirDesejo(achar(D.desejos, ds.id)),
  desejoAoMural: (ds) => {
    const d = achar(D.desejos, ds.id);
    abrirFeito(null, d.areaId, { titulo: `Realizei: ${d.texto}`, data: d.dataFeito || hojeISO(), areaId: d.areaId });
    d.noMural = true;
    salvar();
  },

  novoDiario: (ds) => abrirDiario(null, ds.dia),
  editarDiario: (ds) => abrirDiario(achar(D.diario, ds.id)),
  diarioDia: (ds) => {
    const e = D.diario.find((x) => x.data === ds.dia);
    abrirDiario(e || null, ds.dia);
  },

  editarArea: (ds) => abrirArea(achar(D.areas, ds.id)),

  exportar: () => exportar(),
  importar: () => importar(),
  exemplos: async () => {
    if (!(await confirmar('Isso vai <strong>substituir</strong> metas, objetivos, hábitos, caixinhas, sonhos e feitos pelos exemplos. Suas configurações são mantidas.', { botao: 'Carregar exemplos' }))) return;
    carregarExemplos();
    mudou();
    toast('✨ Exemplos carregados!');
  },
  resetar: async () => {
    if (!(await confirmar('Todos os seus dados serão apagados deste navegador. Recomendamos exportar um backup antes.', { botao: 'Apagar tudo' }))) return;
    D = dadosPadrao();
    D.config.boasVindas = true;
    salvar();
    aplicarTema();
    location.hash = '#inicio';
    renderizar();
    toast('Tudo limpo. Um novo começo 🌱');
  },
};

function ajustarMeta(id, sinal) {
  const m = achar(D.metas, id);
  if (!m) return;
  const antes = progressoMeta(m);
  const passo = Number(m.passo) || 1;
  m.atual = Math.max(0, Math.round(((Number(m.atual) || 0) + sinal * passo) * 100) / 100);
  mudou();
  celebrarSeConcluiu(m, antes);
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-acao]');
  if (!el || el.disabled) return;
  const fn = ACOES[el.dataset.acao];
  if (!fn) return;
  if (el.tagName === 'A' && el.dataset.acao !== 'irTrimestres') return fn(el.dataset, el, e);
  e.preventDefault();
  fn(el.dataset, el, e);
});

/* ---------- Mudanças (checkbox, selects, textareas) ---------- */
const MUDANCAS = {
  foco: (el) => { const f = achar(D.foco, el.dataset.id); if (f) { f.feito = el.checked; mudou(); } },
  objetivo: (el) => { const o = achar(D.objetivos, el.dataset.id); if (o) { o.feito = el.checked; mudou(); if (o.feito) toast('✅ Objetivo concluído!'); } },
  etapa: (el) => {
    const m = achar(D.metas, el.dataset.meta);
    const et = m && m.etapas.find((x) => x.id === el.dataset.etapa);
    if (!et) return;
    const antes = progressoMeta(m);
    et.feito = el.checked;
    mudou();
    celebrarSeConcluiu(m, antes);
  },
  metaSimples: (el) => {
    const m = achar(D.metas, el.dataset.id);
    if (!m) return;
    const antes = progressoMeta(m);
    m.concluida = el.checked;
    mudou();
    celebrarSeConcluiu(m, antes);
  },
  notaArea: (el) => {
    const a = achar(D.areas, el.dataset.id);
    if (!a) return;
    if (el.value) a.notas[el.dataset.mes] = Number(el.value); else delete a.notas[el.dataset.mes];
    mudou();
  },
  visaoArea: (el) => {
    const a = achar(D.areas, el.dataset.id);
    if (a) { a.visao = el.value.trim(); salvar(); toast('💭 Visão salva'); }
  },
  desejo: (el) => {
    const d = achar(D.desejos, el.dataset.id);
    if (!d) return;
    d.feito = el.checked;
    d.dataFeito = el.checked ? hojeISO() : '';
    mudou();
    if (d.feito) toast('🌈 Sonho realizado!', { texto: 'Levar ao mural', fn: () => ACOES.desejoAoMural({ id: d.id }) });
  },
  statusItem: (el) => {
    const i = achar(D.listas[el.dataset.lista], el.dataset.id);
    if (!i) return;
    i.status = el.value;
    if (i.status === 'concluido' && !i.data) i.data = hojeISO();
    mudou();
  },
};

document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-mudar]');
  if (el && MUDANCAS[el.dataset.mudar]) MUDANCAS[el.dataset.mudar](el);
});

/* ---------- Formulários inline ---------- */
const FORMS = {
  foco: (form) => {
    const texto = form.elements.texto.value.trim();
    if (!texto) return;
    D.foco.push({ id: uid(), texto, data: hojeISO(), feito: false });
    // mantém só os últimos 60 dias
    const limite = dataISO(addDias(new Date(), -60));
    D.foco = D.foco.filter((f) => f.data >= limite);
    mudou();
    setTimeout(() => $('[data-form="foco"] input')?.focus());
  },
  config: (form) => {
    const el = form.elements;
    Object.assign(D.config, {
      nome: el.nome.value.trim(),
      palavra: el.palavra.value.trim(),
      visao: el.visao.value.trim(),
      metaLivros: Math.max(0, Number(el.metaLivros.value) || 0),
      modo: el.modo.value,
      paleta: form.querySelector('input[name="paleta"]:checked')?.value || 'lilas',
    });
    salvar();
    aplicarTema();
    renderizar();
    toast('✅ Configurações salvas');
  },
};

document.addEventListener('submit', (e) => {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  FORMS[form.dataset.form]?.(form);
});

// Prévia da paleta ao escolher nas configurações
document.addEventListener('input', (e) => {
  if (e.target.name === 'paleta' && e.target.closest('[data-form="config"]')) {
    document.documentElement.dataset.paleta = e.target.value;
  }
});

/* ---------- Início ---------- */
carregar();
aplicarTema();
montarNav();
renderizar();
if (!D.config.boasVindas) {
  D.config.boasVindas = true;
  salvar();
  boasVindas();
}

if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !location.hostname.endsWith('claude.ai') && !location.hostname.endsWith('claudeusercontent.com')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
