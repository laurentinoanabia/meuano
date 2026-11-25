# 🌸 Meu Ano 2027

Site de organização pessoal para 2027: todas as áreas da vida, metas, objetivos, hábitos, feitos e muito mais.
Tem tema **lilás** ou **rosa bebê**, modo claro e escuro, e funciona no computador e no celular.

## O que tem

| Página | O que faz |
|---|---|
| 🏠 **Início** | Saudação, palavra do ano, progresso do ano, foco do dia, hábitos de hoje, roda da vida, metas em andamento, objetivos do trimestre e últimos feitos |
| 🌸 **Áreas da vida** | 8 áreas (Saúde e corpo, Mente e emocional, Carreira e trabalho, Finanças, Relacionamentos e família, Aprendizado, Lazer e experiências, Espiritualidade e propósito). Cada uma tem visão, nota mensal de 1 a 10, metas, hábitos, sonhos e feitos |
| 🎯 **Metas e objetivos** | Metas anuais medidas por número, por etapas ou como feito/não feito, mais objetivos por trimestre (T1 a T4) |
| 🔁 **Hábitos** | Grade mensal estilo “não quebre a corrente”, com sequências 🔥, meta semanal e resumo do ano |
| 🏆 **Mural de feitos** | Linha do tempo de conquistas, com foto opcional |
| 📝 **Revisões** | Semanal (define o foco da semana), mensal (atualiza as notas da roda da vida) e trimestral |
| 🎞️ **Retrospectiva** | Resumo automático do ano, pronto para imprimir ou salvar em PDF |
| 💸 **Finanças** | Receitas e despesas por mês, limites por categoria, visão do ano e caixinhas de economia |
| 📖 **Livros, filmes e viagens** | Listas em colunas (quero / em andamento / concluído), com desafio de leitura |
| 🌈 **Lista da vida** | Sonhos e experiências para realizar um dia |
| 📔 **Diário** | Registros com humor e gratidão, e um mapa de humor do ano inteiro |
| ⚙️ **Configurações** | Nome, palavra e visão do ano, tema, áreas, backup e importação |

## Como usar

Não precisa instalar nada: é HTML, CSS e JavaScript puro.

- **Mais fácil:** baixe o arquivo `meuano-2027.html` (tudo em um arquivo só) e abra no navegador, no computador ou no celular.
- **No computador, com a pasta do projeto:** abra o arquivo `index.html` no navegador.
- **Publicado na internet (GitHub Pages):** no GitHub, vá em *Settings → Pages*, escolha a branch e a pasta `/ (root)` e salve. O site fica em `https://<seu-usuario>.github.io/meuano/`.
- **No celular:** abra o endereço publicado e use “Adicionar à tela de início” para usar como app.

## Seus dados

Tudo fica salvo **apenas no navegador** (localStorage), então nada vai para nenhum servidor.

- Use **Configurações → Exportar backup** com frequência. Se o arquivo não baixar, o backup aparece como texto para copiar. O site lembra você quando passar de 30 dias sem backup.
- Para levar os dados para outro aparelho, exporte em um e use **Importar backup** no outro (escolhendo o arquivo ou colando o texto).
- Limpar os dados do navegador apaga as informações, por isso o backup é importante.

## Estrutura

```
index.html            página única
css/styles.css        estilos e temas (lilás / rosa, claro / escuro)
js/core.js            dados, armazenamento e regras
js/ui.js              modais, formulários e gráficos
js/views.js           início, áreas, metas, hábitos, feitos, revisões e retrospectiva
js/views-extras.js    finanças, listas, lista da vida, diário e configurações
js/app.js             navegação, ações e formulários
sw.js                 funcionamento offline
meuano-2027.html      versão em arquivo único (gerada)
ferramentas/gerar-arquivo-unico.py   gera o meuano-2027.html
```

Depois de mudar qualquer arquivo, rode `python3 ferramentas/gerar-arquivo-unico.py` para atualizar o `meuano-2027.html`.
