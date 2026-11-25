'use strict';
/* =========================================================
   Páginas extras: finanças, listas, lista da vida, diário, configurações
   ========================================================= */

/* ================= Finanças ================= */
VIEWS.financas = () => {
  if (!estado.finMes) estado.finMes = mesAtualAno();
  const m = estado.finMes;
  const k = mesKey(m);
  const F = D.financas;
  const lanc = F.lancamentos.filter((l) => l.mes === k);
  const receitas = lanc.filter((l) => l.tipo === 'receita');
  const despesas = lanc.filter((l) => l.tipo === 'despesa');
  const rec = soma(receitas), desp = soma(despesas), saldo = rec - desp;
  const taxa = rec > 0 ? Math.round((saldo / rec) * 100) : 0;

  const categorias = CATEGORIAS_DESPESA
    .map((c) => ({ c, v: soma(despesas.filter((l) => l.categoria === c)), lim: Number(F.limites[c]) || 0 }))
    .filter((x) => x.v || x.lim)
    .sort((a, b) => b.v - a.v);

  const anual = Array.from({ length: 12 }, (_, i) => {
    const ls = F.lancamentos.filter((l) => l.mes === mesKey(i + 1));
    return { r: soma(ls.filter((l) => l.tipo === 'receita')), d: soma(ls.filter((l) => l.tipo === 'despesa')) };
  });
  const maxAnual = Math.max(1, ...anual.map((x) => Math.max(x.r, x.d)));
  const totAnoR = soma(anual, 'r'), totAnoD = soma(anual, 'd');

  const linhaLanc = (l) => `<div class="linha-item">
    <span class="area-icone" style="--cor:${l.tipo === 'receita' ? '#9fd8b8' : '#f4adc8'};width:36px;height:36px;font-size:1rem;border-radius:11px">${l.tipo === 'receita' ? '↓' : '↑'}</span>
    <div class="cresce"><strong class="truncar" style="display:block">${esc(l.descricao || l.categoria)}</strong><span class="muted pequeno">${esc(l.categoria)}</span></div>
    <strong class="num" style="color:${l.tipo === 'receita' ? 'var(--ok)' : 'var(--text)'}">${l.tipo === 'receita' ? '+' : '−'} ${fmtDinheiro(l.valor)}</strong>
    <button class="icon-btn mini" data-acao="editarLancamento" data-id="${l.id}" aria-label="Editar lançamento">✎</button>
  </div>`;

  return `
    ${cabecalho('💸 Finanças', 'Orçamento mensal simples e caixinhas para seus objetivos.', '<button class="btn" data-acao="editarLimites">⚙️ Limites</button><button class="btn primario" data-acao="novoLancamento">+ Lançamento</button>')}
    <div class="secao-titulo" style="margin-top:0">
      <div class="mes-nav">
        <button class="icon-btn mini" data-acao="finMes" data-delta="-1" aria-label="Mês anterior" ${m <= 1 ? 'disabled' : ''}>‹</button>
        <strong>${MESES[m - 1]} ${ANO}</strong>
        <button class="icon-btn mini" data-acao="finMes" data-delta="1" aria-label="Próximo mês" ${m >= 12 ? 'disabled' : ''}>›</button>
      </div>
    </div>
    <section class="stats">
      ${stat('💚', fmtDinheiro(rec), 'receitas do mês')}
      ${stat('🧾', fmtDinheiro(desp), 'despesas do mês')}
      ${stat(saldo >= 0 ? '✨' : '⚠️', fmtDinheiro(saldo), 'saldo do mês')}
      ${stat('🐷', `${taxa}%`, 'da renda poupada')}
    </section>

    <section class="grid-2">
      <div class="card">
        <div class="card-topo"><h2>📋 Lançamentos</h2><span class="muted pequeno">${lanc.length} no mês</span></div>
        ${lanc.length ? `
          ${receitas.length ? `<h3 class="muted pequeno" style="margin:4px 0">RECEITAS</h3>${receitas.map(linhaLanc).join('')}` : ''}
          ${despesas.length ? `<h3 class="muted pequeno" style="margin:14px 0 4px">DESPESAS</h3>${[...despesas].sort((a, b) => b.valor - a.valor).map(linhaLanc).join('')}` : ''}`
          : vazio('🧾', 'Nenhum lançamento neste mês.', '<button class="btn suave mini" data-acao="novoLancamento">+ Adicionar</button>')}
      </div>
      <div class="card">
        <div class="card-topo"><h2>🍰 Despesas por categoria</h2><button class="btn mini suave" data-acao="editarLimites">Limites</button></div>
        ${categorias.length ? `<div class="barras-h">${categorias.map((x) => {
          const p = x.lim ? pct(x.v, x.lim) : desp ? Math.round((x.v / desp) * 100) : 0;
          const excedeu = x.lim && x.v > x.lim;
          return `<div class="linha"><span class="truncar">${esc(x.c)}</span><span class="num pequeno"><strong>${fmtDinheiro(x.v)}</strong>${x.lim ? ` / ${fmtDinheiro(x.lim)}` : ''}${excedeu ? ' ⚠️' : ''}</span>
            <div class="barra ${excedeu ? 'excedeu' : ''}"><span style="width:${p}%"></span></div></div>`;
        }).join('')}</div><p class="muted pequeno" style="margin-top:12px">Com limite definido, a barra mostra quanto do limite já foi usado.</p>`
          : '<p class="muted">As despesas aparecerão aqui separadas por categoria.</p>'}
      </div>
    </section>

    <section class="card secao">
      <div class="card-topo"><h2>📆 Visão do ano</h2>
        <span class="legenda" style="margin:0"><span><i style="background:var(--primary)"></i>Receitas</span><span><i style="background:var(--accent)"></i>Despesas</span></span></div>
      <div class="barras-v">${anual.map((x, i) => `<div class="col ${i + 1 === m ? 'ativo' : ''}">
        <div class="par"><div class="b rec" style="height:${(x.r / maxAnual) * 100}%" title="Receitas: ${fmtDinheiro(x.r)}"></div><div class="b desp" style="height:${(x.d / maxAnual) * 100}%" title="Despesas: ${fmtDinheiro(x.d)}"></div></div>
        <small>${MESES_C[i]}</small></div>`).join('')}</div>
      <p class="muted pequeno" style="margin-top:10px">No ano: receitas ${fmtDinheiro(totAnoR)} · despesas ${fmtDinheiro(totAnoD)} · saldo <strong>${fmtDinheiro(totAnoR - totAnoD)}</strong></p>
    </section>

    <div class="secao-titulo"><h2>🐷 Caixinhas</h2><button class="btn mini suave" data-acao="novaCaixinha">+ Nova caixinha</button></div>
    ${F.caixinhas.length ? `<section class="grid-cards">${F.caixinhas.map((c) => {
      const p = pct(c.atual, c.alvo);
      return `<div class="card meta ${p >= 100 ? 'concluida' : ''}">
        <div class="meta-topo"><h3>${esc(c.icone || '🐷')} ${esc(c.nome)}</h3><button class="icon-btn mini" data-acao="editarCaixinha" data-id="${c.id}" aria-label="Editar caixinha">✎</button></div>
        <div class="stat-valor">${fmtDinheiro(c.atual)}</div>
        <div class="meta-prog"><span>${p}% de ${fmtDinheiro(c.alvo)}</span><span>${c.prazo ? `até ${fmtData(c.prazo)}` : ''}</span></div>
        ${barra(p)}
        <button class="btn mini suave" data-acao="depositar" data-id="${c.id}">+ Depositar / retirar</button>
      </div>`;
    }).join('')}</section>` : vazio('🐷', 'Crie caixinhas para reserva, viagem, presente…')}`;
};

/* ================= Listas ================= */
const LISTAS = {
  livros: {
    rotulo: '📚 Livros', item: 'livro', campoTitulo: 'Título', campoSub: 'Autor(a)',
    status: [['quero', '📌 Quero ler'], ['andamento', '📖 Lendo'], ['concluido', '✅ Lidos']],
  },
  filmes: {
    rotulo: '🎬 Filmes e séries', item: 'filme ou série', campoTitulo: 'Título', campoSub: 'Tipo (filme, série, documentário…)',
    status: [['quero', '📌 Quero ver'], ['andamento', '🍿 Assistindo'], ['concluido', '✅ Vistos']],
  },
  viagens: {
    rotulo: '✈️ Viagens', item: 'viagem', campoTitulo: 'Destino', campoSub: 'Tipo (praia, natureza, cidade…)',
    status: [['quero', '💭 Sonho'], ['andamento', '🧳 Planejando'], ['concluido', '✅ Realizadas']],
  },
};

VIEWS.listas = () => {
  const aba = estado.listaAba;
  const cfg = LISTAS[aba];
  const itens = D.listas[aba];
  const concluidosAno = itens.filter((i) => i.status === 'concluido' && doAno(i.data)).length;
  const metaLivros = Number(D.config.metaLivros) || 0;

  return `
    ${cabecalho('📖 Livros, filmes e viagens', 'Listas para lembrar do que você quer viver e registrar o que já viveu.', `<button class="btn primario" data-acao="novoItemLista" data-lista="${aba}">+ Adicionar ${cfg.item}</button>`)}
    ${abas('listaAba', Object.entries(LISTAS).map(([k, v]) => [k, v.rotulo]))}
    ${aba === 'livros' && metaLivros ? `<div class="card" style="margin-bottom:18px;display:flex;align-items:center;gap:18px;flex-wrap:wrap">
        <div class="anel mini" style="--p:${pct(concluidosAno, metaLivros)}"><span>${pct(concluidosAno, metaLivros)}%</span></div>
        <div style="flex:1;min-width:180px"><h3>Desafio de leitura ${ANO}</h3><p class="muted">${concluidosAno} de ${metaLivros} livros lidos. <a href="#/config">Alterar meta</a></p></div>
      </div>` : `<p class="muted" style="margin-bottom:16px">${concluidosAno} concluído(s) em ${ANO}.</p>`}
    <section class="kanban">
      ${cfg.status.map(([s, rotulo]) => {
        const doStatus = itens.filter((i) => i.status === s);
        return `<div class="kanban-col"><h2>${rotulo}<span>${doStatus.length}</span></h2>
          ${doStatus.map((i) => `<div class="item-card">
            <h3>${esc(i.titulo)}</h3>
            ${i.sub ? `<span class="muted pequeno">${esc(i.sub)}</span>` : ''}
            ${i.nota ? estrelas(i.nota) : ''}
            ${i.data && s === 'concluido' ? `<span class="muted pequeno">${fmtData(i.data)}</span>` : ''}
            ${i.comentario ? `<p class="pequeno" style="overflow-wrap:anywhere">${esc(i.comentario)}</p>` : ''}
            <div class="linha-acoes">
              <select data-mudar="statusItem" data-lista="${aba}" data-id="${i.id}" aria-label="Mudar status">${cfg.status.map(([v, r]) => `<option value="${v}" ${v === i.status ? 'selected' : ''}>${r}</option>`).join('')}</select>
              <span class="espaco"></span>
              <button class="icon-btn mini" data-acao="editarItemLista" data-lista="${aba}" data-id="${i.id}" aria-label="Editar">✎</button>
            </div>
          </div>`).join('') || '<p class="muted pequeno centro" style="padding:10px">Vazio</p>'}
        </div>`;
      }).join('')}
    </section>`;
};

/* ================= Lista da vida ================= */
function itemDesejo(d) {
  return `<li class="${d.feito ? 'feito' : ''}">
    <label class="check"><input type="checkbox" data-mudar="desejo" data-id="${d.id}" ${d.feito ? 'checked' : ''}><span>${esc(d.texto)}${d.feito && d.dataFeito ? `<small class="obj-meta">realizado em ${fmtData(d.dataFeito)}</small>` : ''}</span></label>
    ${d.feito && !d.noMural ? `<button class="btn mini suave" data-acao="desejoAoMural" data-id="${d.id}" title="Registrar no mural de feitos">🏆</button>` : ''}
    <button class="icon-btn mini" data-acao="editarDesejo" data-id="${d.id}" aria-label="Editar">✎</button>
  </li>`;
}

VIEWS.desejos = () => {
  const f = estado.desejosFiltro;
  const lista = D.desejos.filter((d) => f === 'todas' || d.areaId === f);
  const abertos = lista.filter((d) => !d.feito);
  const feitos = lista.filter((d) => d.feito);
  const total = D.desejos.length, ok = D.desejos.filter((d) => d.feito).length;
  return `
    ${cabecalho('🌈 Lista da vida', 'Sonhos, experiências e coisas que você quer fazer um dia, sem pressa.', '<button class="btn primario" data-acao="novoDesejo">+ Novo sonho</button>')}
    <div class="card" style="margin-bottom:18px;display:flex;align-items:center;gap:18px;flex-wrap:wrap">
      <div class="anel mini" style="--p:${pct(ok, total)}"><span>${ok}</span></div>
      <div style="flex:1;min-width:180px"><h3>${ok} de ${total} sonhos realizados</h3><p class="muted">Quando realizar um, marque e leve para o mural de feitos 🏆</p></div>
    </div>
    ${filtrosArea('desejosFiltro')}
    ${lista.length ? `<section class="grid-2">
      <div class="card"><h2 style="margin-bottom:12px">💭 Para realizar (${abertos.length})</h2>${abertos.length ? `<ul class="lista">${abertos.map(itemDesejo).join('')}</ul>` : '<p class="muted">Tudo realizado! Hora de sonhar mais 😄</p>'}</div>
      <div class="card"><h2 style="margin-bottom:12px">🌟 Realizados (${feitos.length})</h2>${feitos.length ? `<ul class="lista">${feitos.map(itemDesejo).join('')}</ul>` : '<p class="muted">O primeiro está chegando.</p>'}</div>
    </section>` : vazio('🌈', 'Escreva sem filtro: lugares, experiências, aprendizados, aventuras.', '<button class="btn primario" data-acao="novoDesejo">+ Adicionar sonho</button>')}`;
};

/* ================= Diário ================= */
VIEWS.diario = () => {
  const entradas = [...D.diario].sort((a, b) => b.data.localeCompare(a.data));
  const porDia = {};
  D.diario.forEach((e) => { if (e.humor) porDia[e.data] = e.humor; });
  const hoje = hojeISO();
  const doAnoQtd = D.diario.filter((e) => doAno(e.data)).length;

  const heat = MESES_C.map((m, i) => {
    const nd = diasNoMes(ANO, i);
    let s = `<span class="mes-rotulo">${m}</span>`;
    for (let d = 1; d <= 31; d++) {
      if (d > nd) { s += '<span class="dia vazio-dia"></span>'; continue; }
      const iso = dataISO(new Date(ANO, i, d));
      const h = porDia[iso];
      s += `<button type="button" class="dia ${h ? 'h' + h : ''}" data-acao="diarioDia" data-dia="${iso}" title="${fmtData(iso)}${h ? ' · ' + HUMORES[h - 1].t : ''}" aria-label="${fmtData(iso)}"></button>`;
    }
    return s;
  }).join('');

  return `
    ${cabecalho('📔 Diário', `Um espaço para registrar como você está. ${doAnoQtd} ${doAnoQtd === 1 ? 'registro' : 'registros'} em ${ANO}.`, '<button class="btn primario" data-acao="novoDiario">+ Escrever hoje</button>')}
    <section class="card">
      <div class="card-topo"><h2>🎨 Humor do ano</h2>
        <span class="legenda" style="margin:0">${HUMORES.map((h) => `<span title="${h.t}">${h.e}<i class="dia h${h.v}" style="display:inline-block;width:12px;height:12px;border-radius:3px;margin:0 0 0 4px;vertical-align:middle"></i></span>`).join('')}</span>
      </div>
      <div class="rolagem-x"><div class="heatmap">${heat}</div></div>
      <p class="muted pequeno" style="margin-top:8px">Toque em um dia para escrever ou ver o registro.</p>
    </section>
    <h2 class="secao-titulo">✍️ Registros</h2>
    ${entradas.length ? `<div class="pilha">${entradas.map((e) => {
      const h = e.humor ? HUMORES[e.humor - 1] : null;
      return `<article class="card diario-entrada">
        <span class="diario-humor" title="${h ? h.t : ''}">${h ? h.e : '📝'}</span>
        <div class="cresce">
          <div class="meta-topo"><strong>${maiuscula(fmtDataLonga(e.data))}${e.data.slice(0, 4) !== String(new Date().getFullYear()) ? ` de ${e.data.slice(0, 4)}` : ''}</strong>
            <button class="icon-btn mini" data-acao="editarDiario" data-id="${e.id}" aria-label="Editar registro">✎</button></div>
          ${e.texto ? `<p>${esc(e.texto)}</p>` : ''}
          ${e.gratidao ? `<div class="gratidao">🙏 ${esc(e.gratidao)}</div>` : ''}
        </div>
      </article>`;
    }).join('')}</div>` : vazio('📔', 'Nenhum registro ainda. Como foi o seu dia?', `<button class="btn primario" data-acao="novoDiario" data-dia="${hoje}">Escrever agora</button>`)}`;
};

/* ================= Configurações ================= */
VIEWS.config = () => {
  const c = D.config;
  let usado = 0;
  try { usado = (localStorage.getItem(CHAVE) || '').length; } catch { /* sem acesso */ }
  const kb = Math.round((usado * 2) / 1024);
  return `
    ${cabecalho('⚙️ Configurações', 'Personalize o seu ano e cuide dos seus dados.')}
    <section class="grid-2">
      <form class="card form-grid" data-form="config" style="align-content:start">
        <h2 class="campo full">🌸 Sobre o seu ano</h2>
        <label class="campo"><span>Seu nome ou apelido</span><input name="nome" value="${esc(c.nome)}" maxlength="60"></label>
        <label class="campo"><span>Palavra do ano</span><input name="palavra" value="${esc(c.palavra)}" maxlength="40" placeholder="Ex.: Constância, Leveza, Coragem"></label>
        <label class="campo full"><span>Visão do ano</span><textarea name="visao" rows="3" maxlength="500" placeholder="Uma frase que resume como você quer viver 2027">${esc(c.visao)}</textarea></label>
        <label class="campo"><span>Meta de livros em ${ANO}</span><input type="number" name="metaLivros" min="0" max="500" value="${esc(c.metaLivros)}"></label>
        <label class="campo"><span>Modo</span><select name="modo">
          ${[['auto', '🌓 Automático (do sistema)'], ['claro', '☀️ Claro'], ['escuro', '🌙 Escuro']].map(([v, r]) => `<option value="${v}" ${c.modo === v ? 'selected' : ''}>${r}</option>`).join('')}
        </select></label>
        <div class="campo full"><span>Cor do tema</span>
          <div class="paletas">
            <label class="paleta-opcao"><input type="radio" name="paleta" value="lilas" ${c.paleta === 'lilas' ? 'checked' : ''}><span><i style="background:linear-gradient(135deg,#c4b0f0,#9b7dd6)"></i>Lilás</span></label>
            <label class="paleta-opcao"><input type="radio" name="paleta" value="rosa" ${c.paleta === 'rosa' ? 'checked' : ''}><span><i style="background:linear-gradient(135deg,#fbd3e2,#e38aae)"></i>Rosa bebê</span></label>
          </div>
        </div>
        <div class="form-acoes"><span class="espaco"></span><button class="btn primario">Salvar</button></div>
      </form>

      <div class="pilha">
        <div class="card">
          <h2 style="margin-bottom:8px">🎨 Áreas da vida</h2>
          <p class="muted pequeno" style="margin-bottom:12px">Você pode renomear e trocar o ícone e a cor de cada área.</p>
          <div class="pilha" style="gap:6px">${D.areas.map((a) => `<div class="linha-item"><span class="area-icone" style="--cor:${a.cor};width:36px;height:36px;font-size:1rem;border-radius:11px">${a.icone}</span><span class="cresce truncar">${esc(a.nome)}</span><button class="btn mini" data-acao="editarArea" data-id="${a.id}">Editar</button></div>`).join('')}</div>
        </div>
        <div class="card">
          <h2 style="margin-bottom:8px">💾 Seus dados</h2>
          <p class="muted pequeno">Tudo fica salvo <strong>apenas neste navegador</strong> (cerca de ${kb} KB usados). Faça backups com frequência e use “Importar” para levar seus dados a outro aparelho.</p>
          <p class="pequeno" style="margin:8px 0 14px">Último backup: <strong>${c.ultimoBackup ? fmtData(c.ultimoBackup) : 'nunca'}</strong></p>
          <div class="acoes">
            <button class="btn primario" data-acao="exportar">⬇️ Exportar backup</button>
            <button class="btn" data-acao="importar">⬆️ Importar backup</button>
          </div>
          <input type="file" id="arquivo-import" accept="application/json,.json" hidden>
        </div>
        <div class="card">
          <h2 style="margin-bottom:8px">🧪 Outros</h2>
          <div class="acoes">
            <button class="btn" data-acao="exemplos">✨ Carregar exemplos</button>
            <button class="btn perigo-texto" data-acao="resetar">🗑 Apagar tudo</button>
          </div>
        </div>
      </div>
    </section>`;
};
