'use strict';
/* =========================================================
   Núcleo: constantes, utilidades, dados e armazenamento
   ========================================================= */

const ANO = 2027;
const CHAVE = 'meuano2027:dados';
const PARTIDA = `${ANO - 1}-12`; // nota de "ponto de partida" da roda da vida

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MESES_C = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DIAS_C = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const AREAS_PADRAO = [
  { id: 'saude', nome: 'Saúde e corpo', icone: '🌿', cor: '#9fd8b8' },
  { id: 'mente', nome: 'Mente e emocional', icone: '🧠', cor: '#c4b0f0' },
  { id: 'carreira', nome: 'Carreira e trabalho', icone: '💼', cor: '#a7c6ef' },
  { id: 'financas', nome: 'Finanças', icone: '💰', cor: '#f0d88f' },
  { id: 'relacoes', nome: 'Relacionamentos e família', icone: '💞', cor: '#f4adc8' },
  { id: 'aprendizado', nome: 'Aprendizado', icone: '📚', cor: '#f5bf9f' },
  { id: 'lazer', nome: 'Lazer e experiências', icone: '🎈', cor: '#98dada' },
  { id: 'proposito', nome: 'Espiritualidade e propósito', icone: '✨', cor: '#dab0ee' },
];

const CATEGORIAS_DESPESA = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Compras', 'Assinaturas', 'Investimentos', 'Doações', 'Outros'];
const CATEGORIAS_RECEITA = ['Salário', 'Renda extra', 'Rendimentos', 'Presente', 'Outros'];

const HUMORES = [
  { v: 1, e: '😢', t: 'Muito difícil' },
  { v: 2, e: '😕', t: 'Difícil' },
  { v: 3, e: '😐', t: 'Ok' },
  { v: 4, e: '🙂', t: 'Bom' },
  { v: 5, e: '😄', t: 'Ótimo' },
];

/* ---------- Utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function dataISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function hojeISO() { return dataISO(new Date()); }
function lerISO(s) {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
function fmtData(s, opts) {
  if (!s) return '';
  return lerISO(s)
    .toLocaleDateString('pt-BR', opts || { day: '2-digit', month: 'short', year: 'numeric' })
    .replace(/\./g, '');
}
function fmtDataLonga(s) {
  return lerISO(s).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}
function maiuscula(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function fmtDinheiro(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtNum(v) {
  return Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}
function pct(a, b) {
  a = Number(a) || 0; b = Number(b) || 0;
  if (b <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((a / b) * 100)));
}
function soma(lista, campo = 'valor') {
  return lista.reduce((s, x) => s + (Number(x[campo]) || 0), 0);
}
function mesKey(m, ano = ANO) { return `${ano}-${String(m).padStart(2, '0')}`; }
function diasNoMes(ano, mes0) { return new Date(ano, mes0 + 1, 0).getDate(); }
function doAno(s) { return typeof s === 'string' && s.startsWith(String(ANO)); }
function addDias(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function inicioSemana(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // segunda-feira
  return x;
}
function semanaISO(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dia = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dia);
  const ini = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return { ano: t.getUTCFullYear(), semana: Math.ceil(((t - ini) / 864e5 + 1) / 7) };
}
function progressoAno() {
  const agora = new Date();
  const ini = new Date(ANO, 0, 1);
  const fim = new Date(ANO + 1, 0, 1);
  const total = Math.round((fim - ini) / 864e5);
  if (agora < ini) return { antes: true, faltam: Math.ceil((ini - agora) / 864e5), pct: 0, total };
  if (agora >= fim) return { depois: true, pct: 100, total };
  const dia = Math.floor((agora - ini) / 864e5) + 1;
  return { dia, total, pct: Math.round((dia / total) * 100), semana: semanaISO(agora).semana };
}
function trimestreAtual() {
  const n = new Date();
  return n.getFullYear() === ANO ? Math.floor(n.getMonth() / 3) + 1 : n.getFullYear() > ANO ? 4 : 1;
}
function mesAtualAno() {
  const n = new Date();
  return n.getFullYear() === ANO ? n.getMonth() + 1 : n.getFullYear() > ANO ? 12 : 1;
}
function saudacao() {
  const h = new Date().getHours();
  return h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

/* ---------- Dados ---------- */
function dadosPadrao() {
  return {
    versao: 1,
    config: {
      nome: '',
      palavra: '',
      visao: '',
      paleta: 'lilas',
      modo: 'auto',
      metaLivros: 12,
      boasVindas: false,
      ultimoBackup: '',
    },
    areas: AREAS_PADRAO.map((a) => ({ ...a, visao: '', notas: {} })),
    metas: [],
    objetivos: [],
    habitos: [],
    feitos: [],
    foco: [],
    revisoes: { semanal: [], mensal: [], trimestral: [] },
    financas: { lancamentos: [], limites: {}, caixinhas: [] },
    listas: { livros: [], filmes: [], viagens: [] },
    desejos: [],
    diario: [],
  };
}

function ehObjeto(v) { return v && typeof v === 'object' && !Array.isArray(v); }
function mesclarPadrao(base, obj) {
  if (!ehObjeto(obj)) return base;
  for (const k of Object.keys(base)) {
    if (obj[k] === undefined) obj[k] = base[k];
    else if (ehObjeto(base[k]) && ehObjeto(obj[k]) && Object.keys(base[k]).length) mesclarPadrao(base[k], obj[k]);
  }
  return obj;
}

let D = null;

function carregar() {
  let dados = null;
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) dados = JSON.parse(bruto);
  } catch (e) {
    console.warn('Não foi possível ler os dados salvos', e);
  }
  D = mesclarPadrao(dadosPadrao(), dados || dadosPadrao());
  if (!Array.isArray(D.areas) || !D.areas.length) D.areas = dadosPadrao().areas;
  D.areas.forEach((a) => { a.notas = a.notas || {}; });
}

function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(D));
    return true;
  } catch (e) {
    console.error(e);
    if (typeof toast === 'function') toast('⚠️ Não foi possível salvar. O armazenamento pode estar cheio (fotos grandes?). Exporte um backup.');
    return false;
  }
}

/* ---------- Regras de negócio ---------- */
function area(id) {
  return D.areas.find((a) => a.id === id) || { id: '', nome: 'Geral', icone: '🌱', cor: '#d9cdef', notas: {} };
}
function notaAtual(a) {
  const ks = Object.keys(a.notas || {}).filter((k) => Number(a.notas[k]) > 0).sort();
  return ks.length ? Number(a.notas[ks[ks.length - 1]]) : 0;
}
function notaPartida(a) { return Number(a.notas?.[PARTIDA]) || 0; }

function progressoMeta(m) {
  if (m.tipo === 'numerica') return pct(m.atual, m.alvo);
  if (m.tipo === 'etapas') {
    const t = (m.etapas || []).length;
    return t ? Math.round((m.etapas.filter((e) => e.feito).length / t) * 100) : 0;
  }
  return m.concluida ? 100 : 0;
}
function mediaProgresso(metas) {
  return metas.length ? Math.round(metas.reduce((s, m) => s + progressoMeta(m), 0) / metas.length) : 0;
}

function sequenciaAtual(h) {
  let d = new Date();
  let n = 0;
  if (!h.registros[dataISO(d)]) d = addDias(d, -1);
  while (h.registros[dataISO(d)]) { n++; d = addDias(d, -1); }
  return n;
}
function melhorSequencia(h, soAno = false) {
  const dias = Object.keys(h.registros).filter((k) => h.registros[k] && (!soAno || doAno(k))).sort();
  let melhor = 0, atual = 0, anterior = null;
  for (const k of dias) {
    const d = lerISO(k);
    atual = anterior && Math.round((d - anterior) / 864e5) === 1 ? atual + 1 : 1;
    melhor = Math.max(melhor, atual);
    anterior = d;
  }
  return melhor;
}
function feitosNaSemana(h, ref = new Date()) {
  const ini = inicioSemana(ref);
  let n = 0;
  for (let i = 0; i < 7; i++) if (h.registros[dataISO(addDias(ini, i))]) n++;
  return n;
}

function comprimirImagem(arquivo, max = 1000, qualidade = 0.78) {
  return new Promise((resolver, rejeitar) => {
    const leitor = new FileReader();
    leitor.onload = () => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * escala);
        c.height = Math.round(img.height * escala);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolver(c.toDataURL('image/jpeg', qualidade));
      };
      img.onerror = rejeitar;
      img.src = leitor.result;
    };
    leitor.onerror = rejeitar;
    leitor.readAsDataURL(arquivo);
  });
}

/* ---------- Exemplos ---------- */
function carregarExemplos() {
  const h = hojeISO();
  const meta = (o) => ({ id: uid(), criadoEm: h, descricao: '', prazo: '', unidade: '', atual: 0, alvo: 0, passo: 1, etapas: [], concluida: false, ...o });
  const etapas = (lista) => lista.map((texto) => ({ id: uid(), texto, feito: false }));

  const mLivros = meta({ titulo: 'Ler 24 livros', areaId: 'aprendizado', tipo: 'numerica', alvo: 24, unidade: 'livros', prazo: '2027-12-31', descricao: 'Trocar tempo de tela por leitura e aprender coisas novas.' });
  const mCorrida = meta({ titulo: 'Correr uma prova de 10 km', areaId: 'saude', tipo: 'etapas', prazo: '2027-09-30', descricao: 'Ter mais disposição e cuidar do coração.', etapas: etapas(['Correr 3 km sem parar', 'Correr 5 km', 'Fazer a inscrição na prova', 'Correr 8 km nos treinos', 'Completar os 10 km 🏅']) });
  const mReserva = meta({ titulo: 'Montar reserva de emergência', areaId: 'financas', tipo: 'numerica', alvo: 15000, unidade: 'R$', passo: 500, prazo: '2027-12-31', descricao: 'Ter tranquilidade para imprevistos.' });
  const mTerapia = meta({ titulo: 'Manter a terapia o ano inteiro', areaId: 'mente', tipo: 'simples' });
  const mCarreira = meta({ titulo: 'Conquistar uma nova certificação', areaId: 'carreira', tipo: 'etapas', prazo: '2027-10-31', etapas: etapas(['Conversar com a liderança sobre plano de carreira', 'Escolher a certificação', 'Estudar 3x por semana', 'Fazer a prova']) });
  const mFamilia = meta({ titulo: 'Um encontro especial por mês com a família', areaId: 'relacoes', tipo: 'numerica', alvo: 12, unidade: 'encontros' });
  const mViagem = meta({ titulo: 'Conhecer 2 lugares novos', areaId: 'lazer', tipo: 'numerica', alvo: 2, unidade: 'lugares' });
  const mVolunt = meta({ titulo: 'Fazer trabalho voluntário 4 vezes', areaId: 'proposito', tipo: 'numerica', alvo: 4, unidade: 'vezes' });
  D.metas = [mLivros, mCorrida, mReserva, mTerapia, mCarreira, mFamilia, mViagem, mVolunt];

  const obj = (trimestre, titulo, m) => ({ id: uid(), trimestre, titulo, metaId: m ? m.id : '', areaId: m ? m.areaId : '', feito: false });
  D.objetivos = [
    obj(1, 'Ler 6 livros', mLivros),
    obj(1, 'Correr 5 km sem parar', mCorrida),
    obj(1, 'Guardar R$ 3.000', mReserva),
    obj(1, 'Escolher a certificação', mCarreira),
    obj(2, 'Ler mais 6 livros', mLivros),
    obj(2, 'Inscrever na prova de 10 km', mCorrida),
    obj(2, 'Primeira viagem nova', mViagem),
    obj(3, 'Completar a prova de 10 km', mCorrida),
    obj(3, 'Fazer a prova da certificação', mCarreira),
    obj(4, 'Fechar a reserva de emergência', mReserva),
    obj(4, 'Retrospectiva e planejamento de 2028', null),
  ];

  const hab = (nome, icone, areaId, metaSemanal) => ({ id: uid(), nome, icone, areaId, metaSemanal, registros: {} });
  D.habitos = [
    hab('Beber 2 L de água', '💧', 'saude', 7),
    hab('Ler 20 minutos', '📖', 'aprendizado', 5),
    hab('Meditar 10 minutos', '🧘', 'mente', 5),
    hab('Exercício físico', '🏃', 'saude', 4),
    hab('Anotar 3 gratidões', '🙏', 'proposito', 7),
    hab('Registrar gastos', '🧾', 'financas', 7),
  ];

  const partida = { saude: 6, mente: 5, carreira: 7, financas: 5, relacoes: 8, aprendizado: 6, lazer: 4, proposito: 6 };
  D.areas.forEach((a) => {
    if (!a.notas[PARTIDA] && partida[a.id]) a.notas[PARTIDA] = partida[a.id];
  });

  D.desejos = [
    { id: uid(), texto: 'Ver a aurora boreal', areaId: 'lazer', feito: false, dataFeito: '' },
    { id: uid(), texto: 'Aprender a nadar bem', areaId: 'saude', feito: false, dataFeito: '' },
    { id: uid(), texto: 'Fazer um curso de cerâmica', areaId: 'aprendizado', feito: false, dataFeito: '' },
    { id: uid(), texto: 'Escrever cartas para pessoas importantes', areaId: 'relacoes', feito: false, dataFeito: '' },
  ];

  D.listas.livros = [
    { id: uid(), titulo: 'Hábitos Atômicos', sub: 'James Clear', status: 'quero', nota: null, data: '', comentario: '' },
    { id: uid(), titulo: 'Torto Arado', sub: 'Itamar Vieira Junior', status: 'quero', nota: null, data: '', comentario: '' },
  ];
  D.listas.viagens = [
    { id: uid(), titulo: 'Chapada dos Veadeiros', sub: 'Natureza', status: 'quero', nota: null, data: '', comentario: '' },
  ];

  D.financas.caixinhas = [
    { id: uid(), nome: 'Reserva de emergência', icone: '🛟', alvo: 15000, atual: 0, prazo: '2027-12-31' },
    { id: uid(), nome: 'Viagem dos sonhos', icone: '✈️', alvo: 6000, atual: 0, prazo: '2027-07-01' },
  ];
  D.financas.limites = { Alimentação: 1200, Lazer: 400, Compras: 300, Assinaturas: 120 };

  D.feitos = [
    { id: uid(), titulo: 'Comecei a planejar o meu 2027 🎉', data: h, areaId: 'proposito', descricao: 'Primeiro passo: organizar áreas, metas e hábitos.', foto: '' },
  ];

  if (!D.config.palavra) D.config.palavra = 'Constância';
  if (!D.config.visao) D.config.visao = 'Em 2027 eu cuido de mim com carinho, avanço um pouco todos os dias e celebro cada conquista.';
}
