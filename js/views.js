'use strict';
/* =========================================================
   Páginas principais
   ========================================================= */

const VIEWS = {};
const estado = {
  metasAba: 'ano',
  metasFiltro: 'todas',
  habMes: null,
  revAba: 'semanal',
  finMes: null,
  listaAba: 'livros',
  feitosFiltro: 'todas',
  desejosFiltro: 'todas',
};

function cabecalho(titulo, sub, acoes = '') {
  return `<header class="pagina-topo"><div><h1>${titulo}</h1>${sub ? `<p class="muted">${sub}</p>` : ''}</div>${acoes ? `<div class="acoes">${acoes}</div>` : ''}</header>`;
}

/* ================= Início ================= */
VIEWS.inicio = () => {
  const c = D.config;
  const hoje = hojeISO();
  const pa = progressoAno();
  const metas = D.metas;
  const concluidas = metas.filter((m) => progressoMeta(m) >= 100).length;
  const tri = trimestreAtual();
  const objsTri = D.objetivos.filter((o) => o.trimestre === tri);
  const focoHoje = D.foco.filter((f) => f.data === hoje);
  const ultimaSemanal = [...D.revisoes.semanal].sort((a, b) => b.data.localeCompare(a.data))[0];
  const emAndamento = metas.filter((m) => progressoMeta(m) < 100).sort((a, b) => progressoMeta(b) - progressoMeta(a)).slice(0, 5);
  const ultimosFeitos = [...D.feitos].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 4);
  const habFeitos = D.habitos.filter((h) => h.registros[hoje]).length;

  const anoTexto = pa.antes
    ? `Faltam <strong>${pa.faltam}</strong> ${pa.faltam === 1 ? 'dia' : 'dias'} para 2027 ✨`
    : pa.depois ? '2027 concluído 🎉 Veja sua <a href="#/retrospectiva">retrospectiva</a>'
    : `Dia <strong>${pa.dia}</strong> de ${pa.total} · semana ${pa.semana}`;

  const temDados = metas.length || D.feitos.length || D.habitos.length;
  const diasSemBackup = c.ultimoBackup ? Math.floor((new Date() - lerISO(c.ultimoBackup)) / 864e5) : null;
  const avisoBackup = temDados && (diasSemBackup === null || diasSemBackup > 30)
    ? `<div class="aviso">💾 <span>${diasSemBackup === null ? 'Você ainda não fez nenhum backup.' : `Seu último backup foi há ${diasSemBackup} dias.`} Os dados ficam só neste navegador.</span><span class="espaco"></span><button class="btn mini primario" data-acao="exportar">Fazer backup agora</button></div>`
    : '';

  return `
  ${avisoBackup}
  <section class="hero card">
    <div class="hero-texto">
      <p class="hero-saudacao">${saudacao()}${c.nome ? `, ${esc(c.nome)}` : ''} 💜</p>
      <h1>Meu Ano <span class="destaque">2027</span></h1>
      ${c.palavra ? `<p class="palavra">Palavra do ano: <strong>${esc(c.palavra)}</strong></p>` : `<p class="palavra muted">Escolha sua palavra do ano em <a href="#/config">Configurações</a>.</p>`}
      ${c.visao ? `<blockquote>${esc(c.visao)}</blockquote>` : ''}
    </div>
    <div class="hero-ano">
      <div class="anel" style="--p:${pa.pct}"><span>${pa.pct}%</span></div>
      <p>${anoTexto}</p>
    </div>
  </section>

  <section class="stats">
    ${stat('🎯', `${concluidas}/${metas.length}`, 'metas concluídas')}
    ${stat('📈', `${mediaProgresso(metas)}%`, 'progresso médio das metas')}
    ${stat('🔁', `${habFeitos}/${D.habitos.length}`, 'hábitos feitos hoje')}
    ${stat('🏆', D.feitos.filter((f) => doAno(f.data)).length, 'feitos em 2027')}
  </section>

  <section class="grid-2">
    <div class="card">
      <div class="card-topo"><h2>☀️ Foco de hoje</h2><span class="muted pequeno">${maiuscula(fmtDataLonga(hoje))}</span></div>
      ${focoHoje.length ? `<ul class="lista">${focoHoje.map((f) => `
        <li class="${f.feito ? 'feito' : ''}">
          <label class="check"><input type="checkbox" data-mudar="foco" data-id="${f.id}" ${f.feito ? 'checked' : ''}><span>${esc(f.texto)}</span></label>
          <button type="button" class="icon-btn mini" data-acao="removerFoco" data-id="${f.id}" aria-label="Remover">✕</button>
        </li>`).join('')}</ul>` : '<p class="muted">Quais são as 1 a 3 coisas mais importantes de hoje?</p>'}
      <form class="inline-form" data-form="foco">
        <input name="texto" placeholder="Adicionar prioridade do dia…" maxlength="140" required aria-label="Nova prioridade do dia">
        <button class="btn primario" aria-label="Adicionar">+</button>
      </form>
      ${ultimaSemanal && ultimaSemanal.foco ? `<div class="dica" style="margin:16px 0 0"><strong>🎯 Foco da semana:</strong><br>${esc(ultimaSemanal.foco)}</div>` : ''}
    </div>

    <div class="card">
      <div class="card-topo"><h2>🔁 Hábitos de hoje</h2><a href="#/habitos" class="pequeno">ver todos</a></div>
      ${D.habitos.length ? `<div class="pilha" style="gap:8px">${D.habitos.map((h) => botaoHabitoHoje(h, hoje)).join('')}</div>`
        : vazio('🌱', 'Nenhum hábito ainda.', '<button class="btn suave mini" data-acao="novoHabito">Criar hábito</button>')}
    </div>
  </section>

  <section class="grid-2 secao">
    <div class="card centro">
      <div class="card-topo"><h2>🌸 Roda da vida</h2><a href="#/areas" class="pequeno">ver áreas</a></div>
      ${D.areas.some((a) => notaAtual(a)) ? radarSVG([{ classe: 'partida', valor: notaPartida }, { classe: 'atual', valor: notaAtual }]) + legendaRadar()
        : vazio('🎡', 'Dê uma nota de 1 a 10 para cada área da sua vida.', '<a class="btn suave mini" href="#/areas">Avaliar áreas</a>')}
    </div>
    <div class="card">
      <div class="card-topo"><h2>🎯 Metas em andamento</h2><a href="#/metas" class="pequeno">ver metas</a></div>
      ${emAndamento.length ? emAndamento.map((m) => {
        const a = area(m.areaId), p = progressoMeta(m);
        return `<div class="linha-item"><span class="area-icone" style="--cor:${a.cor};width:38px;height:38px;font-size:1.1rem;border-radius:12px">${a.icone}</span>
          <div class="cresce"><div class="meta-prog"><strong class="truncar" style="color:var(--text)">${esc(m.titulo)}</strong><span>${p}%</span></div>${barra(p, a.cor)}</div></div>`;
      }).join('') : vazio('🎯', metas.length ? 'Todas as metas concluídas! 🎉' : 'Nenhuma meta criada ainda.', metas.length ? '' : '<button class="btn suave mini" data-acao="novaMeta">Criar meta</button>')}
    </div>
  </section>

  <section class="grid-2 secao">
    <div class="card">
      <div class="card-topo"><h2>🗓️ Objetivos do ${tri}º trimestre</h2><a href="#/metas" data-acao="irTrimestres" class="pequeno">ver trimestres</a></div>
      ${objsTri.length ? `<ul class="lista">${objsTri.map(itemObjetivo).join('')}</ul>`
        : vazio('🗓️', 'Nada planejado para este trimestre.', `<button class="btn suave mini" data-acao="novoObjetivo" data-tri="${tri}">Adicionar objetivo</button>`)}
    </div>
    <div class="card">
      <div class="card-topo"><h2>🏆 Últimos feitos</h2><button class="btn mini suave" data-acao="novoFeito">+ Registrar</button></div>
      ${ultimosFeitos.length ? ultimosFeitos.map((f) => {
        const a = area(f.areaId);
        return `<div class="linha-item">
          ${f.foto ? `<img src="${f.foto}" alt="" style="width:44px;height:44px;border-radius:12px;object-fit:cover">` : `<span class="area-icone" style="--cor:${a.cor};width:44px;height:44px;font-size:1.2rem;border-radius:12px">${a.icone}</span>`}
          <div class="cresce"><button class="link-btn truncar" style="display:block;max-width:100%" data-acao="editarFeito" data-id="${f.id}">${esc(f.titulo)}</button><span class="muted pequeno">${fmtData(f.data)}</span></div></div>`;
      }).join('') : vazio('🏆', 'Registre suas conquistas, grandes e pequenas.')}
    </div>
  </section>`;
};

function botaoHabitoHoje(h, hoje) {
  const a = area(h.areaId);
  const on = !!h.registros[hoje];
  const seq = sequenciaAtual(h);
  return `<button type="button" class="hab-hoje-btn ${on ? 'on' : ''}" style="--cor:${a.cor}" data-acao="toggleHabito" data-id="${h.id}" data-dia="${hoje}" aria-pressed="${on}">
    <span class="bolinha">${on ? '✓' : ''}</span>
    <span class="cresce"><span class="truncar" style="display:block">${esc(h.icone || '')} ${esc(h.nome)}</span>
    <small>${seq ? `🔥 ${seq} ${seq === 1 ? 'dia' : 'dias'} seguidos` : 'Comece hoje!'} · ${feitosNaSemana(h)}/${h.metaSemanal || 7} na semana</small></span>
  </button>`;
}

function itemObjetivo(o) {
  const m = D.metas.find((x) => x.id === o.metaId);
  return `<li class="${o.feito ? 'feito' : ''}">
    <label class="check"><input type="checkbox" data-mudar="objetivo" data-id="${o.id}" ${o.feito ? 'checked' : ''}>
      <span>${esc(o.titulo)}${m ? `<small class="obj-meta">↳ ${esc(m.titulo)}</small>` : ''}</span></label>
    <button type="button" class="icon-btn mini" data-acao="editarObjetivo" data-id="${o.id}" aria-label="Editar objetivo">✎</button>
  </li>`;
}

/* ================= Áreas ================= */
VIEWS.areas = () => {
  const ordenadas = [...D.areas].sort((a, b) => (notaAtual(a) || 99) - (notaAtual(b) || 99));
  return `
  ${cabecalho('🌸 Áreas da vida', 'As 8 dimensões que você quer cuidar em 2027. Dê notas de 1 a 10 todo mês e acompanhe a evolução.')}
  <section class="grid-2">
    <div class="card centro">
      <h2 style="margin-bottom:10px">Roda da vida</h2>
      ${radarSVG([{ classe: 'partida', valor: notaPartida }, { classe: 'atual', valor: notaAtual }])}
      ${legendaRadar()}
    </div>
    <div class="card">
      <h2 style="margin-bottom:6px">Onde focar</h2>
      <p class="muted pequeno" style="margin-bottom:12px">Áreas com nota mais baixa aparecem primeiro: elas pedem mais carinho.</p>
      <div class="barras-h">
        ${ordenadas.map((a) => {
          const n = notaAtual(a), p0 = notaPartida(a);
          const dif = n && p0 && n !== p0 ? ` <span class="pequeno" style="color:${n > p0 ? 'var(--ok)' : 'var(--perigo)'}">${n > p0 ? '▲' : '▼'} ${Math.abs(n - p0)}</span>` : '';
          return `<div class="linha"><a href="#/area/${a.id}" style="color:var(--text);text-decoration:none;font-weight:700" class="truncar">${a.icone} ${esc(a.nome)}</a><span class="num"><strong>${n || '–'}</strong>/10${dif}</span>${barra(n * 10, a.cor)}</div>`;
        }).join('')}
      </div>
    </div>
  </section>
  <h2 class="secao-titulo">Suas áreas</h2>
  <section class="grid-cards">
    ${D.areas.map((a) => {
      const metas = D.metas.filter((m) => m.areaId === a.id);
      const habitos = D.habitos.filter((h) => h.areaId === a.id).length;
      const feitos = D.feitos.filter((f) => f.areaId === a.id).length;
      const n = notaAtual(a);
      return `<a class="card area-card" href="#/area/${a.id}" style="--cor:${a.cor}">
        <div class="area-topo"><span class="area-icone">${a.icone}</span><span class="nota-grande">${n || '–'}<small>/10</small></span></div>
        <h3>${esc(a.nome)}</h3>
        ${a.visao ? `<p class="muted pequeno" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(a.visao)}</p>` : '<p class="muted pequeno">Toque para escrever sua visão para esta área.</p>'}
        <div class="meta-prog"><span>${metas.length} metas · ${habitos} hábitos · ${feitos} feitos</span><span>${mediaProgresso(metas)}%</span></div>
        ${barra(mediaProgresso(metas), a.cor)}
      </a>`;
    }).join('')}
  </section>`;
};

VIEWS.area = (id) => {
  const a = D.areas.find((x) => x.id === id);
  if (!a) return vazio('🤔', 'Área não encontrada.', '<a class="btn" href="#/areas">Voltar</a>');
  const metas = D.metas.filter((m) => m.areaId === a.id);
  const habitos = D.habitos.filter((h) => h.areaId === a.id);
  const feitos = D.feitos.filter((f) => f.areaId === a.id).sort((x, y) => y.data.localeCompare(x.data));
  const desejos = D.desejos.filter((d) => d.areaId === a.id);
  const meses = [{ k: PARTIDA, l: 'Partida' }, ...MESES_C.map((m, i) => ({ k: mesKey(i + 1), l: m }))];
  const hoje = hojeISO();

  return `
  <a href="#/areas" class="voltar">← Áreas da vida</a>
  <div class="area-cab" style="--cor:${a.cor}">
    <span class="area-icone">${a.icone}</span>
    <div style="flex:1;min-width:200px"><h1>${esc(a.nome)}</h1><p class="muted">Nota atual: <strong>${notaAtual(a) || '–'}</strong>/10 · ponto de partida: ${notaPartida(a) || '–'}</p></div>
    <button class="btn" data-acao="editarArea" data-id="${a.id}">✎ Nome e ícone</button>
  </div>

  <section class="grid-2">
    <div class="card">
      <h2 style="margin-bottom:10px">💭 Minha visão para 2027</h2>
      <textarea rows="5" data-mudar="visaoArea" data-id="${a.id}" placeholder="Como você quer que esta área esteja no fim de 2027? Escreva no presente, como se já fosse verdade." aria-label="Visão para a área">${esc(a.visao)}</textarea>
      <p class="muted pequeno" style="margin-top:6px">Salva automaticamente ao sair do campo.</p>
    </div>
    <div class="card">
      <h2 style="margin-bottom:10px">📊 Notas mês a mês</h2>
      <div class="notas-grade">
        ${meses.map((m) => `<label class="${m.k === PARTIDA ? 'partida' : ''}"><span>${m.l}</span>
          <select data-mudar="notaArea" data-id="${a.id}" data-mes="${m.k}" aria-label="Nota de ${m.l}">
            <option value="">–</option>${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<option ${Number(a.notas[m.k]) === n ? 'selected' : ''}>${n}</option>`).join('')}
          </select></label>`).join('')}
      </div>
      <div style="margin-top:14px">${sparkline(meses.map((m) => ({ rotulo: m.l === 'Partida' ? 'início' : m.l, valor: Number(a.notas[m.k]) || 0 })))}</div>
    </div>
  </section>

  <div class="secao-titulo"><h2>🎯 Metas</h2><button class="btn mini suave" data-acao="novaMeta" data-area="${a.id}">+ Nova meta</button></div>
  ${metas.length ? `<section class="grid-cards">${metas.map(cardMeta).join('')}</section>` : vazio('🎯', 'Nenhuma meta nesta área ainda.')}

  <section class="grid-2 secao">
    <div class="card">
      <div class="card-topo"><h2>🔁 Hábitos</h2><button class="btn mini suave" data-acao="novoHabito" data-area="${a.id}">+ Hábito</button></div>
      ${habitos.length ? `<div class="pilha" style="gap:8px">${habitos.map((h) => botaoHabitoHoje(h, hoje)).join('')}</div>` : '<p class="muted">Nenhum hábito ligado a esta área.</p>'}
    </div>
    <div class="card">
      <div class="card-topo"><h2>🌈 Lista da vida</h2><button class="btn mini suave" data-acao="novoDesejo" data-area="${a.id}">+ Sonho</button></div>
      ${desejos.length ? `<ul class="lista">${desejos.map(itemDesejo).join('')}</ul>` : '<p class="muted">Nenhum sonho desta área na lista.</p>'}
    </div>
  </section>

  <div class="secao-titulo"><h2>🏆 Feitos</h2><button class="btn mini suave" data-acao="novoFeito" data-area="${a.id}">+ Registrar feito</button></div>
  ${feitos.length ? `<section class="grid-cards">${feitos.map(cardFeito).join('')}</section>` : vazio('🏆', 'Nenhum feito registrado nesta área ainda.')}`;
};

/* ================= Metas ================= */
function cardMeta(m) {
  const p = progressoMeta(m);
  const a = area(m.areaId);
  const objs = D.objetivos.filter((o) => o.metaId === m.id);
  let controle = '';
  if (m.tipo === 'numerica') {
    const fmt = m.unidade === 'R$' ? fmtDinheiro : fmtNum;
    const u = m.unidade && m.unidade !== 'R$' ? ` ${esc(m.unidade)}` : '';
    controle = `<div class="contador">
      <button type="button" class="icon-btn" data-acao="metaMenos" data-id="${m.id}" aria-label="Diminuir">−</button>
      <strong>${fmt(m.atual)} / ${fmt(m.alvo)}${u}</strong>
      <button type="button" class="icon-btn" data-acao="metaMais" data-id="${m.id}" aria-label="Aumentar">+</button>
    </div>`;
  } else if (m.tipo === 'etapas') {
    controle = `<ul class="etapas">${m.etapas.map((e) => `<li class="${e.feito ? 'feito' : ''}"><label class="check"><input type="checkbox" data-mudar="etapa" data-meta="${m.id}" data-etapa="${e.id}" ${e.feito ? 'checked' : ''}><span>${esc(e.texto)}</span></label></li>`).join('')}</ul>`;
  } else {
    controle = `<label class="check"><input type="checkbox" data-mudar="metaSimples" data-id="${m.id}" ${m.concluida ? 'checked' : ''}><span>Concluída</span></label>`;
  }
  return `<article class="card meta ${p >= 100 ? 'concluida' : ''}" style="--cor:${a.cor}">
    <div class="meta-topo">${chipArea(a)}<button type="button" class="icon-btn mini" data-acao="editarMeta" data-id="${m.id}" aria-label="Editar meta">✎</button></div>
    <h3>${esc(m.titulo)}</h3>
    ${m.descricao ? `<p class="muted pequeno">${esc(m.descricao)}</p>` : ''}
    <div class="meta-prog"><span>${p >= 100 ? '<span class="selo">✓ Concluída</span>' : `${p}% concluído`}</span><span>${m.prazo ? `até ${fmtData(m.prazo)}` : ''}</span></div>
    ${barra(p, a.cor)}
    ${controle}
    ${objs.length ? `<p class="muted pequeno">🗓️ ${objs.filter((o) => o.feito).length}/${objs.length} objetivos trimestrais</p>` : ''}
  </article>`;
}

VIEWS.metas = () => {
  const aba = estado.metasAba;
  let corpo = '';
  if (aba === 'ano') {
    const f = estado.metasFiltro;
    const metas = D.metas.filter((m) => f === 'todas' || m.areaId === f);
    const abertas = metas.filter((m) => progressoMeta(m) < 100);
    const feitas = metas.filter((m) => progressoMeta(m) >= 100);
    corpo = `
      ${filtrosArea('metasFiltro')}
      ${metas.length ? `
        <section class="grid-cards">${abertas.map(cardMeta).join('')}</section>
        ${feitas.length ? `<h2 class="secao-titulo">✅ Concluídas (${feitas.length})</h2><section class="grid-cards">${feitas.map(cardMeta).join('')}</section>` : ''}`
      : vazio('🎯', 'Nenhuma meta aqui ainda. Que tal começar por uma meta para cada área?', '<button class="btn primario" data-acao="novaMeta">+ Criar meta</button>')}`;
  } else {
    const atual = trimestreAtual();
    const nomes = ['', 'jan – mar', 'abr – jun', 'jul – set', 'out – dez'];
    corpo = `
      <div class="dica">💡 Quebre cada meta anual em objetivos menores por trimestre. Assim o ano fica com 4 “mini-anos” e é mais fácil ajustar a rota.</div>
      <section class="trimestres">
        ${[1, 2, 3, 4].map((t) => {
          const objs = D.objetivos.filter((o) => o.trimestre === t);
          const feitos = objs.filter((o) => o.feito).length;
          return `<div class="card trimestre ${t === atual ? 'atual' : ''}">
            <div class="card-topo"><h2>${t}º tri <small>${nomes[t]}</small></h2><span class="muted pequeno">${feitos}/${objs.length}</span></div>
            ${barra(pct(feitos, objs.length))}
            <ul class="lista" style="margin-top:12px">${objs.map(itemObjetivo).join('')}</ul>
            <button class="btn mini suave largo" style="margin-top:12px" data-acao="novoObjetivo" data-tri="${t}">+ Objetivo</button>
          </div>`;
        }).join('')}
      </section>`;
  }
  return `
    ${cabecalho('🎯 Metas e objetivos', 'Metas para o ano, divididas em objetivos trimestrais.',
      aba === 'ano' ? '<button class="btn primario" data-acao="novaMeta">+ Nova meta</button>' : '<button class="btn primario" data-acao="novoObjetivo">+ Novo objetivo</button>')}
    ${abas('metasAba', [['ano', '📅 Metas do ano'], ['tri', '🗓️ Trimestres']])}
    ${corpo}`;
};

/* ================= Hábitos ================= */
VIEWS.habitos = () => {
  const agora = new Date();
  if (!estado.habMes) estado.habMes = { ano: agora.getFullYear(), mes: agora.getMonth() };
  const { ano, mes } = estado.habMes;
  const nd = diasNoMes(ano, mes);
  const hoje = hojeISO();
  const dias = Array.from({ length: nd }, (_, i) => {
    const d = new Date(ano, mes, i + 1);
    return { iso: dataISO(d), n: i + 1, dow: d.getDay() };
  });
  const decorridos = dias.filter((d) => d.iso <= hoje).length;

  const tabela = D.habitos.length ? `
    <div class="card"><div class="rolagem-x">
      <table class="hab-tabela">
        <thead><tr><th class="hab-nome">Hábito</th>
          ${dias.map((d) => `<th class="${d.dow === 0 || d.dow === 6 ? 'fds' : ''} ${d.iso === hoje ? 'hoje-col' : ''}">${DIAS_C[d.dow]}<br>${d.n}</th>`).join('')}
          <th>%</th></tr></thead>
        <tbody>
          ${D.habitos.map((h) => {
            const a = area(h.areaId);
            const feitosMes = dias.filter((d) => h.registros[d.iso]).length;
            const seq = sequenciaAtual(h);
            return `<tr>
              <td class="hab-nome"><button class="link-btn" data-acao="editarHabito" data-id="${h.id}">${esc(h.icone || '')} ${esc(h.nome)}</button>
                <small>${seq ? `🔥 ${seq}` : '·'} · ${feitosNaSemana(h)}/${h.metaSemanal || 7} na semana</small></td>
              ${dias.map((d) => {
                const on = !!h.registros[d.iso];
                return `<td><button type="button" class="hab-cel ${on ? 'on' : ''} ${d.iso === hoje ? 'hoje' : ''}" style="--cor:${a.cor}" data-acao="toggleHabito" data-id="${h.id}" data-dia="${d.iso}" ${d.iso > hoje ? 'disabled' : ''} aria-pressed="${on}" aria-label="${esc(h.nome)} em ${d.n}/${mes + 1}"></button></td>`;
              }).join('')}
              <td class="hab-pct">${decorridos ? pct(feitosMes, decorridos) : 0}%</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div></div>` : vazio('🔁', 'Nenhum hábito ainda. Comece com 2 ou 3, pequenos e fáceis.', '<button class="btn primario" data-acao="novoHabito">+ Criar hábito</button>');

  const resumo = D.habitos.length ? `
    <h2 class="secao-titulo">📊 Resumo de ${ANO}</h2>
    <section class="grid-cards-p">
      ${D.habitos.map((h) => {
        const a = area(h.areaId);
        const totalAno = Object.keys(h.registros).filter((k) => h.registros[k] && doAno(k)).length;
        return `<div class="card" style="--cor:${a.cor}">
          <div class="meta-topo"><strong class="truncar">${esc(h.icone || '')} ${esc(h.nome)}</strong></div>
          <p class="muted pequeno" style="margin-top:6px">${chipArea(a)}</p>
          <div class="grid-2" style="gap:8px;margin-top:10px;grid-template-columns:1fr 1fr">
            <div><div class="stat-valor" style="font-size:1.3rem">${totalAno}</div><div class="muted pequeno">dias em ${ANO}</div></div>
            <div><div class="stat-valor" style="font-size:1.3rem">${melhorSequencia(h)}</div><div class="muted pequeno">melhor sequência</div></div>
          </div>
        </div>`;
      }).join('')}
    </section>` : '';

  return `
    ${cabecalho('🔁 Hábitos', 'Pequenas ações repetidas constroem o ano. Toque nos quadradinhos para marcar.', '<button class="btn primario" data-acao="novoHabito">+ Novo hábito</button>')}
    <div class="secao-titulo" style="margin-top:0">
      <div class="mes-nav">
        <button class="icon-btn mini" data-acao="habMes" data-delta="-1" aria-label="Mês anterior">‹</button>
        <strong>${MESES[mes]} ${ano}</strong>
        <button class="icon-btn mini" data-acao="habMes" data-delta="1" aria-label="Próximo mês">›</button>
      </div>
      <button class="btn mini" data-acao="habMes" data-delta="0">Hoje</button>
    </div>
    ${tabela}
    ${resumo}`;
};

/* ================= Feitos ================= */
function cardFeito(f) {
  const a = area(f.areaId);
  return `<article class="card feito-card" style="--cor:${a.cor}">
    ${f.foto ? `<img src="${f.foto}" alt="${esc(f.titulo)}" loading="lazy">` : ''}
    <div class="feito-corpo">
      <span class="feito-data">${fmtData(f.data, { day: '2-digit', month: 'long', year: 'numeric' })}</span>
      <h3>${esc(f.titulo)}</h3>
      ${f.descricao ? `<p>${esc(f.descricao)}</p>` : ''}
      <div class="feito-rodape">${chipArea(a)}<button type="button" class="icon-btn mini" data-acao="editarFeito" data-id="${f.id}" aria-label="Editar feito">✎</button></div>
    </div>
  </article>`;
}

VIEWS.feitos = () => {
  const f = estado.feitosFiltro;
  const lista = D.feitos.filter((x) => f === 'todas' || x.areaId === f).sort((a, b) => b.data.localeCompare(a.data));
  const grupos = {};
  lista.forEach((x) => { const k = x.data.slice(0, 7); (grupos[k] = grupos[k] || []).push(x); });
  const doAnoQtd = D.feitos.filter((x) => doAno(x.data)).length;

  return `
    ${cabecalho('🏆 Mural de feitos', `Tudo o que você conquistou, viveu e celebrou. ${doAnoQtd} ${doAnoQtd === 1 ? 'feito' : 'feitos'} em ${ANO} até agora.`, '<button class="btn primario" data-acao="novoFeito">+ Registrar feito</button>')}
    ${filtrosArea('feitosFiltro')}
    ${lista.length ? Object.keys(grupos).sort().reverse().map((k) => {
      const [y, m] = k.split('-').map(Number);
      return `<section class="timeline-mes"><h2>${MESES[m - 1]} ${y} <span class="chip">${grupos[k].length}</span></h2>
        <div class="grid-cards">${grupos[k].map(cardFeito).join('')}</div></section>`;
    }).join('') : vazio('🏆', 'Nenhum feito por aqui ainda. Vale tudo: terminar um livro, uma conversa difícil, um treino, uma viagem.', '<button class="btn primario" data-acao="novoFeito">+ Registrar o primeiro</button>')}`;
};

/* ================= Revisões ================= */
const REVISOES = {
  semanal: {
    rotulo: 'Semanal', icone: '🗓️',
    dica: '10 a 15 minutos no domingo para olhar a semana que passou e escolher o foco da próxima. O foco aparece na página inicial.',
    campos: () => [
      { name: 'data', label: 'Qualquer dia da semana', type: 'date', required: true, padrao: hojeISO() },
      { name: 'energia', label: 'Energia da semana', type: 'humor' },
      { name: 'bem', label: 'O que foi bem? 🌟', type: 'textarea', full: true },
      { name: 'travou', label: 'O que travou ou me desafiou?', type: 'textarea', full: true },
      { name: 'aprendi', label: 'O que aprendi?', type: 'textarea', full: true },
      { name: 'foco', label: 'Foco da próxima semana 🎯', type: 'textarea', full: true, rows: 2 },
    ],
    titulo: (r) => {
      const d = lerISO(r.data), ini = inicioSemana(d), fim = addDias(ini, 6);
      return `Semana ${semanaISO(d).semana} · ${fmtData(dataISO(ini), { day: '2-digit', month: 'short' })} – ${fmtData(dataISO(fim), { day: '2-digit', month: 'short' })}`;
    },
    ordem: (r) => r.data,
  },
  mensal: {
    rotulo: 'Mensal', icone: '🌙',
    dica: 'No fim de cada mês: celebre, ajuste o que for preciso e dê nota para cada área. As notas atualizam a roda da vida automaticamente.',
    campos: () => [
      { name: 'mes', label: 'Mês', type: 'select', options: MESES.map((m, i) => ({ value: String(i + 1), label: `${m} ${ANO}` })), padrao: String(mesAtualAno()) },
      { name: 'palavra', label: 'Uma palavra para este mês', maxlength: 40 },
      { name: 'destaques', label: 'Destaques e conquistas 🏆', type: 'textarea', full: true },
      { name: 'desafios', label: 'Desafios', type: 'textarea', full: true },
      { name: 'gratidao', label: 'Gratidão: o que este mês me trouxe de bom 🙏', type: 'textarea', full: true },
      { name: 'ajustes', label: 'O que vou ajustar no próximo mês', type: 'textarea', full: true },
      ...D.areas.map((a) => ({ name: 'nota_' + a.id, label: `${a.icone} ${a.nome}`, type: 'number', min: 1, max: 10, step: 1, placeholder: '1 a 10' })),
    ],
    titulo: (r) => `${MESES[r.mes - 1]} ${ANO}${r.palavra ? ` · “${esc(r.palavra)}”` : ''}`,
    ordem: (r) => String(r.mes).padStart(2, '0'),
  },
  trimestral: {
    rotulo: 'Trimestral', icone: '🌼',
    dica: 'A cada 3 meses: veja os objetivos do trimestre, o que avançou nas metas e defina as prioridades do próximo trimestre.',
    campos: () => [
      { name: 'trimestre', label: 'Trimestre', type: 'select', options: [1, 2, 3, 4].map((t) => ({ value: String(t), label: `${t}º trimestre` })), padrao: String(trimestreAtual()) },
      { name: 'conquistas', label: 'Maiores conquistas', type: 'textarea', full: true },
      { name: 'naoAconteceu', label: 'O que não aconteceu e por quê', type: 'textarea', full: true },
      { name: 'aprendizados', label: 'Aprendizados', type: 'textarea', full: true },
      { name: 'prioridades', label: 'Prioridades do próximo trimestre', type: 'textarea', full: true },
    ],
    titulo: (r) => `${r.trimestre}º trimestre de ${ANO}`,
    ordem: (r) => String(r.trimestre),
  },
};

VIEWS.revisoes = () => {
  const tipo = estado.revAba;
  const cfg = REVISOES[tipo];
  const lista = [...D.revisoes[tipo]].sort((a, b) => cfg.ordem(b).localeCompare(cfg.ordem(a)));
  const campos = cfg.campos().filter((c) => c.type === 'textarea');
  return `
    ${cabecalho('📝 Revisões', 'O hábito que transforma planos em resultados: parar, olhar e ajustar.', `<button class="btn primario" data-acao="novaRevisao" data-tipo="${tipo}">+ Nova revisão ${cfg.rotulo.toLowerCase()}</button>`)}
    ${abas('revAba', Object.entries(REVISOES).map(([k, v]) => [k, `${v.icone} ${v.rotulo}`]))}
    <div class="dica">💡 ${cfg.dica}</div>
    ${lista.length ? `<section class="grid-2">${lista.map((r) => {
      const notas = tipo === 'mensal' ? D.areas.filter((a) => r['nota_' + a.id]).map((a) => `<span class="chip" style="--cor:${a.cor}">${a.icone} ${r['nota_' + a.id]}</span>`).join('') : '';
      const humor = r.energia ? HUMORES.find((h) => h.v === r.energia) : null;
      return `<article class="card rev-card">
        <div class="meta-topo"><h3>${humor ? humor.e + ' ' : ''}${cfg.titulo(r)}</h3><button class="icon-btn mini" data-acao="editarRevisao" data-tipo="${tipo}" data-id="${r.id}" aria-label="Editar revisão">✎</button></div>
        <dl>${campos.filter((c) => r[c.name]).map((c) => `<div><dt>${c.label}</dt><dd>${esc(r[c.name])}</dd></div>`).join('') || '<p class="muted">Sem anotações.</p>'}</dl>
        ${notas ? `<div class="notas-mini">${notas}</div>` : ''}
      </article>`;
    }).join('')}</section>` : vazio(cfg.icone, `Nenhuma revisão ${cfg.rotulo.toLowerCase()} ainda.`, `<button class="btn primario" data-acao="novaRevisao" data-tipo="${tipo}">Fazer a primeira</button>`)}`;
};

/* ================= Retrospectiva ================= */
VIEWS.retrospectiva = () => {
  const feitos = D.feitos.filter((f) => doAno(f.data));
  const metasOk = D.metas.filter((m) => progressoMeta(m) >= 100);
  const livros = D.listas.livros.filter((l) => l.status === 'concluido' && doAno(l.data));
  const filmes = D.listas.filmes.filter((l) => l.status === 'concluido' && doAno(l.data));
  const viagens = D.listas.viagens.filter((l) => l.status === 'concluido' && doAno(l.data));
  const desejos = D.desejos.filter((d) => d.feito && doAno(d.dataFeito));
  const diario = D.diario.filter((d) => doAno(d.data));
  const guardado = soma(D.financas.caixinhas, 'atual');
  const melhorHab = D.habitos.map((h) => ({ h, s: melhorSequencia(h, true) })).sort((a, b) => b.s - a.s)[0];
  const diasHabitos = D.habitos.reduce((s, h) => s + Object.keys(h.registros).filter((k) => h.registros[k] && doAno(k)).length, 0);
  const porArea = D.areas.map((a) => ({ a, n: feitos.filter((f) => f.areaId === a.id).length }));
  const maxArea = Math.max(1, ...porArea.map((x) => x.n));
  const humorMes = MESES_C.map((m, i) => {
    const es = diario.filter((d) => d.data.slice(5, 7) === String(i + 1).padStart(2, '0') && d.humor);
    return { m, v: es.length ? soma(es, 'humor') / es.length : 0 };
  });
  const fotos = feitos.filter((f) => f.foto).slice(0, 12);
  const pa = progressoAno();

  return `
    <div class="acoes" style="justify-content:flex-end;margin-bottom:12px"><button class="btn" data-acao="imprimir">🖨 Imprimir / salvar PDF</button></div>
    <section class="card hero retro-hero" style="display:block">
      <p class="hero-saudacao">${pa.depois ? 'Que ano!' : pa.antes ? 'Uma prévia do que vem por aí' : `Até agora, ${pa.pct}% do ano já foi vivido`}</p>
      <h1>Retrospectiva <span class="destaque">${ANO}</span></h1>
      ${D.config.palavra ? `<p class="palavra">A palavra do ano foi <strong>${esc(D.config.palavra)}</strong></p>` : ''}
      ${D.config.nome ? `<p class="muted" style="margin-top:6px">de ${esc(D.config.nome)}</p>` : ''}
    </section>

    <section class="stats cinco">
      ${stat('🏆', feitos.length, 'feitos registrados')}
      ${stat('🎯', `${metasOk.length}/${D.metas.length}`, 'metas concluídas')}
      ${stat('🔁', diasHabitos, 'check-ins de hábitos')}
      ${stat('🔥', melhorHab ? melhorHab.s : 0, melhorHab ? `melhor sequência (${esc(melhorHab.h.nome)})` : 'melhor sequência')}
      ${stat('📚', livros.length, 'livros lidos')}
      ${stat('🎬', filmes.length, 'filmes e séries')}
      ${stat('✈️', viagens.length, 'viagens realizadas')}
      ${stat('🌈', desejos.length, 'sonhos realizados')}
      ${stat('💰', fmtDinheiro(guardado), 'guardado nas caixinhas')}
      ${stat('📔', diario.length, 'páginas de diário')}
    </section>

    <section class="grid-2">
      <div class="card centro">
        <h2 style="margin-bottom:8px">🌸 Como a roda da vida mudou</h2>
        ${radarSVG([{ classe: 'partida', valor: notaPartida }, { classe: 'atual', valor: notaAtual }])}
        ${legendaRadar()}
      </div>
      <div class="card">
        <h2 style="margin-bottom:14px">🏆 Feitos por área</h2>
        <div class="barras-h">${porArea.map(({ a, n }) => `<div class="linha"><span class="truncar">${a.icone} ${esc(a.nome)}</span><strong class="num">${n}</strong>${barra((n / maxArea) * 100, a.cor)}</div>`).join('')}</div>
      </div>
    </section>

    ${diario.length ? `<section class="card secao"><h2>📔 Humor médio por mês</h2>
      <div class="barras-v">${humorMes.map((x) => `<div class="col"><div class="par"><div class="b unica" style="height:${(x.v / 5) * 100}%" title="${x.v ? x.v.toFixed(1) : 'sem registros'}"></div></div><small>${x.m}</small></div>`).join('')}</div></section>` : ''}

    <section class="grid-2 secao">
      <div class="card">
        <h2 style="margin-bottom:12px">🎯 Metas do ano</h2>
        ${D.metas.length ? D.metas.map((m) => {
          const a = area(m.areaId), p = progressoMeta(m);
          return `<div class="linha-item"><span>${p >= 100 ? '✅' : a.icone}</span><div class="cresce"><div class="meta-prog"><strong class="truncar" style="color:var(--text)">${esc(m.titulo)}</strong><span>${p}%</span></div>${barra(p, a.cor)}</div></div>`;
        }).join('') : '<p class="muted">Nenhuma meta cadastrada.</p>'}
      </div>
      <div class="card">
        <h2 style="margin-bottom:12px">✨ Momentos marcantes</h2>
        ${feitos.length ? [...feitos].sort((a, b) => a.data.localeCompare(b.data)).slice(-10).reverse().map((f) => `<div class="linha-item"><span>${area(f.areaId).icone}</span><div class="cresce"><strong>${esc(f.titulo)}</strong><div class="muted pequeno">${fmtData(f.data)}</div></div></div>`).join('') : '<p class="muted">Os feitos de 2027 aparecerão aqui.</p>'}
      </div>
    </section>

    ${fotos.length ? `<section class="card secao"><h2 style="margin-bottom:12px">📸 Álbum do ano</h2>
      <div class="galeria">${fotos.map((f) => `<figure><img src="${f.foto}" alt="${esc(f.titulo)}" loading="lazy"><figcaption>${esc(f.titulo)}</figcaption></figure>`).join('')}</div></section>` : ''}`;
};
