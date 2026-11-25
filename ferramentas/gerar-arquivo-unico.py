#!/usr/bin/env python3
"""Junta HTML, CSS e JS em um único arquivo (meuano-2027.html).

Uso:  python3 ferramentas/gerar-arquivo-unico.py [--fragmento SAIDA]
  --fragmento  gera também uma versão sem <html>/<head>/<body>,
               usada para publicar como página no Claude.
"""
import pathlib, re, sys

raiz = pathlib.Path(__file__).resolve().parent.parent
html = (raiz / 'index.html').read_text(encoding='utf-8')
css = (raiz / 'css/styles.css').read_text(encoding='utf-8')
scripts = re.findall(r'<script src="(js/[^"]+)"></script>', html)
js = '\n'.join((raiz / s).read_text(encoding='utf-8') for s in scripts)

html = html.replace('<link rel="stylesheet" href="css/styles.css">', f'<style>\n{css}\n</style>')
html = re.sub(r'\s*<script src="js/[^"]+"></script>', '', html)
html = html.replace('</body>', f'<script>\n{js.replace("</script", "<\\/script")}\n</script>\n</body>')
for linha in ['<link rel="manifest" href="manifest.webmanifest">', '<link rel="icon" href="icon.svg" type="image/svg+xml">', '<link rel="apple-touch-icon" href="icon.svg">']:
    html = html.replace(linha, '')

(raiz / 'meuano-2027.html').write_text(html, encoding='utf-8')
print('Gerado:', raiz / 'meuano-2027.html')

if '--fragmento' in sys.argv:
    saida = pathlib.Path(sys.argv[sys.argv.index('--fragmento') + 1])
    cabeca = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
    corpo = re.search(r'<body>(.*)</body>', html, re.S).group(1)
    cabeca = re.sub(r'<meta (charset|name="viewport")[^>]*>', '', cabeca)
    # o visualizador do Claude define data-theme; a página decide claro/escuro pelo script
    frag = cabeca.strip() + '\n' + corpo.strip() + '\n'
    saida.write_text(frag, encoding='utf-8')
    print('Fragmento:', saida)
