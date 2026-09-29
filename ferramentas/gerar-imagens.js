// Desenha as imagens derivadas da marca: capa, lombada e contracapa do livro 3D,
// imagem de compartilhamento e ícones. Tudo sai das mesmas cores do site.

const COR = {
  laranja: '#F09135',
  azul: '#1D49A6',
  tinta: '#141414',
  branco: '#FFF9F0',
};

const TITULO = 'Os 7 erros';
const SUBTITULO = ['que estão atrapalhando', 'a educação do', 'seu cachorro'];
const CHAMADA = 'Aprenda como melhorar a comunicação com seu cão e tornar a convivência muito mais tranquila.';
const PERFIL = '@tdogsadestramento';

// Formato carta, o mesmo do PDF (612 × 792 pt), em 2x.
const CAPA = { w: 1224, h: 1584 };
const LOMBADA = { w: 144, h: 1584 };

const grade = document.getElementById('grade');
const status = document.getElementById('status');
const params = new URLSearchParams(location.search);

async function carregar(src) {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

// Repinta uma imagem com alpha numa cor sólida (logo preta -> logo branca).
function tingir(img, cor) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = cor;
  x.fillRect(0, 0, c.width, c.height);
  return c;
}

function quebrar(ctx, texto, largura) {
  const palavras = texto.split(' ');
  const linhas = [];
  let atual = '';
  for (const p of palavras) {
    const teste = atual ? atual + ' ' + p : p;
    if (ctx.measureText(teste).width > largura && atual) {
      linhas.push(atual);
      atual = p;
    } else {
      atual = teste;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

function novoCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// "Os 7 erros": o 7 em gótica azul, como o "Since 2016" da logo.
function tituloComSete(ctx, x, base, tamanho, larguraMax) {
  const partes = [
    { t: 'Os ', font: `900 ${tamanho}px Grenze`, cor: COR.tinta, dy: 0 },
    { t: '7', font: `700 ${tamanho * 1.34}px "Grenze Gotisch"`, cor: COR.azul, dy: tamanho * 0.02 },
    { t: ' erros', font: `900 ${tamanho}px Grenze`, cor: COR.tinta, dy: 0 },
  ];
  const medir = () => partes.reduce((soma, p) => { ctx.font = p.font; return soma + ctx.measureText(p.t).width; }, 0);
  let total = medir();
  if (total > larguraMax) {
    const k = larguraMax / total;
    tamanho *= k;
    partes[0].font = `900 ${tamanho}px Grenze`;
    partes[1].font = `700 ${tamanho * 1.34}px "Grenze Gotisch"`;
    partes[2].font = `900 ${tamanho}px Grenze`;
    total = medir();
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let cx = x;
  for (const p of partes) {
    ctx.font = p.font;
    ctx.fillStyle = p.cor;
    ctx.fillText(p.t, cx, base + p.dy);
    cx += ctx.measureText(p.t).width;
  }
  return tamanho;
}

function anel(ctx, cx, cy, r, espessura, cor) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = espessura;
  ctx.strokeStyle = cor;
  ctx.stroke();
}

function desenharCapa(img) {
  const { w: W, h: H } = CAPA;
  const c = novoCanvas(W, H);
  const ctx = c.getContext('2d');
  const m = 96;

  ctx.fillStyle = COR.laranja;
  ctx.fillRect(0, 0, W, H);

  // Topo: wordmark + área de atuação, e um filete como no cabeçalho do PDF.
  const wmW = 300;
  const wmH = wmW * img.wordmark.naturalHeight / img.wordmark.naturalWidth;
  ctx.drawImage(img.wordmark, m, m, wmW, wmH);
  ctx.font = '700 22px "Schibsted Grotesk"';
  ctx.letterSpacing = '0.14em';
  ctx.fillStyle = COR.tinta;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText('ADESTRAMENTO E COMPORTAMENTO', W - m + 4, m + wmH / 2);
  ctx.letterSpacing = '0px';
  ctx.fillRect(m, m + wmH + 40, W - m * 2, 5);

  // Título
  const tam = tituloComSete(ctx, m - 6, 500, 250, W - m * 2);
  ctx.font = `800 ${Math.round(tam * 0.42)}px Grenze`;
  ctx.fillStyle = COR.tinta;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const lh = Math.round(tam * 0.43);
  SUBTITULO.forEach((linha, i) => ctx.fillText(linha, m, 620 + i * lh));

  // Selo: anel azul com a cabeça do cão, o mesmo desenho da logo redonda.
  const r = 236;
  const cx = W - m - r - 4;
  const cy = H - m - r - 4;
  anel(ctx, cx, cy, r, 38, COR.azul);
  const cabW = 330;
  const cabH = cabW * img.cabeca.naturalHeight / img.cabeca.naturalWidth;
  ctx.drawImage(img.cabeca, cx - cabW / 2, cy - cabH / 2 + 8, cabW, cabH);

  // Base: tipo de material e perfil.
  ctx.fillStyle = COR.tinta;
  ctx.textAlign = 'left';
  ctx.font = '700 38px "Schibsted Grotesk"';
  ctx.fillText('Guia prático de', m, H - m - 118);
  ctx.fillText('comportamento canino', m, H - m - 70);
  ctx.font = '500 28px "Schibsted Grotesk"';
  ctx.fillText(PERFIL, m, H - m);

  return c;
}

function desenharLombada(img) {
  const { w: W, h: H } = LOMBADA;
  const c = novoCanvas(W, H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = COR.azul;
  ctx.fillRect(0, 0, W, H);

  // Texto correndo de cima para baixo, como numa lombada brasileira.
  ctx.save();
  ctx.translate(W / 2, 0);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = COR.branco;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = '900 62px Grenze';
  ctx.fillText('Os 7 erros', 96, 4);
  const wm = tingir(img.wordmark, COR.branco);
  const wmW = 250;
  const wmH = wmW * wm.height / wm.width;
  ctx.drawImage(wm, H - 96 - wmW, -wmH / 2, wmW, wmH);
  ctx.restore();
  return c;
}

function desenharContracapa(img) {
  const { w: W, h: H } = CAPA;
  const c = novoCanvas(W, H);
  const ctx = c.getContext('2d');
  const m = 96;
  ctx.fillStyle = COR.azul;
  ctx.fillRect(0, 0, W, H);

  // Disco laranja com o cão em tinta: sobre o azul, vira o selo redondo da marca.
  // (Tingir a cabeça de branco inverteria a mancha preta do olho.)
  const r = 250;
  const cy = 190 + r;
  ctx.beginPath();
  ctx.arc(W / 2, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = COR.laranja;
  ctx.fill();
  const cabW = 340;
  const cabH = cabW * img.cabeca.naturalHeight / img.cabeca.naturalWidth;
  ctx.drawImage(img.cabeca, (W - cabW) / 2, cy - cabH / 2 + 10, cabW, cabH);

  const wm = tingir(img.wordmark, COR.branco);
  const wmW = 380;
  const wmH = wmW * wm.height / wm.width;
  const wmY = cy + r + 90;
  ctx.drawImage(wm, (W - wmW) / 2, wmY, wmW, wmH);

  ctx.textAlign = 'center';
  ctx.fillStyle = COR.laranja;
  ctx.font = '700 64px "Grenze Gotisch"';
  ctx.fillText('Desde 2016', W / 2, wmY + wmH + 100);

  ctx.fillStyle = COR.branco;
  ctx.font = '400 38px "Schibsted Grotesk"';
  const linhas = quebrar(ctx, CHAMADA, 780);
  linhas.forEach((l, i) => ctx.fillText(l, W / 2, 1180 + i * 54));

  ctx.font = '500 28px "Schibsted Grotesk"';
  ctx.fillText(PERFIL, W / 2, H - m);
  return c;
}

function desenharOG(img, capa) {
  const W = 1200;
  const H = 630;
  const c = novoCanvas(W, H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = COR.laranja;
  ctx.fillRect(0, 0, W, H);

  const m = 72;
  const wmW = 200;
  const wmH = wmW * img.wordmark.naturalHeight / img.wordmark.naturalWidth;
  ctx.drawImage(img.wordmark, m, m, wmW, wmH);

  ctx.fillStyle = COR.tinta;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '900 84px Grenze';
  ['Seu cachorro', 'não é teimoso.', 'Ele está confuso.'].forEach((l, i) => ctx.fillText(l, m, 250 + i * 84));
  ctx.font = '500 28px "Schibsted Grotesk"';
  ctx.fillText('eBook: os 7 erros que atrapalham', m, 520);
  ctx.fillText('a educação do seu cachorro', m, 558);

  // Capa inclinada dentro do anel azul.
  const cx = 930;
  const cy = 330;
  anel(ctx, cx, cy, 250, 30, COR.azul);
  const ch = 440;
  const cw = ch * CAPA.w / CAPA.h;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.07);
  ctx.shadowColor = 'rgba(60, 25, 0, 0.35)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = COR.laranja;
  ctx.fillRect(-cw / 2, -ch / 2, cw, ch);
  ctx.shadowColor = 'transparent';
  ctx.drawImage(capa, -cw / 2, -ch / 2, cw, ch);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(20,20,20,.25)';
  ctx.strokeRect(-cw / 2, -ch / 2, cw, ch);
  ctx.restore();
  return c;
}

function desenharIcone(img, tamanho) {
  const c = novoCanvas(tamanho, tamanho);
  const ctx = c.getContext('2d');
  const s = tamanho / 512;
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.arc(256, 256, 256, 0, Math.PI * 2);
  ctx.fillStyle = COR.azul;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(256, 256, 210, 0, Math.PI * 2);
  ctx.fillStyle = COR.laranja;
  ctx.fill();
  const cabW = 300;
  const cabH = cabW * img.cabeca.naturalHeight / img.cabeca.naturalWidth;
  ctx.drawImage(img.cabeca, 256 - cabW / 2, 256 - cabH / 2 + 6, cabW, cabH);
  return c;
}

function blob(canvas, tipo, qualidade) {
  return new Promise((ok) => canvas.toBlob(ok, tipo, qualidade));
}

async function mostrar(nome, canvas, tipo, qualidade) {
  const b = await blob(canvas, tipo, qualidade);
  const url = URL.createObjectURL(b);
  const fig = document.createElement('figure');
  const cap = document.createElement('figcaption');
  const info = document.createElement('span');
  info.textContent = `${nome} · ${canvas.width}×${canvas.height} · ${Math.round(b.size / 1024)} KB`;
  cap.append(info);
  const a = document.createElement('a');
  a.className = 'baixar';
  a.href = url;
  a.download = nome;
  a.textContent = 'Baixar';
  cap.append(a);
  fig.append(canvas, cap);
  grade.append(fig);
  // Modo desenvolvimento: grava direto em assets/img/ pelo servidor local.
  if (params.has('salvar')) {
    const r = await fetch(`/__salvar?arquivo=assets/img/${nome}`, { method: 'POST', body: b });
    if (!r.ok) throw new Error(`Falha ao salvar ${nome}`);
  }
}

async function iniciar() {
  await Promise.all([
    document.fonts.load('900 100px Grenze'),
    document.fonts.load('800 100px Grenze'),
    document.fonts.load('700 100px "Grenze Gotisch"'),
    document.fonts.load('700 30px "Schibsted Grotesk"'),
    document.fonts.load('500 30px "Schibsted Grotesk"'),
    document.fonts.load('400 30px "Schibsted Grotesk"'),
  ]);
  const img = {
    wordmark: await carregar('../assets/img/logo-wordmark.png'),
    cabeca: await carregar('../assets/img/logo-cabeca.png'),
  };
  status.textContent = 'Gerando…';

  const capa = desenharCapa(img);
  await mostrar('capa-ebook.webp', capa, 'image/webp', 0.92);
  await mostrar('lombada-ebook.webp', desenharLombada(img), 'image/webp', 0.92);
  await mostrar('contracapa-ebook.webp', desenharContracapa(img), 'image/webp', 0.92);
  await mostrar('og-tdogs-ebook.jpg', desenharOG(img, capa), 'image/jpeg', 0.88);
  await mostrar('icone-512.png', desenharIcone(img, 512), 'image/png');
  await mostrar('apple-touch-icon.png', desenharIcone(img, 180), 'image/png');
  await mostrar('favicon-32.png', desenharIcone(img, 32), 'image/png');

  status.textContent = params.has('salvar') ? 'Pronto. Arquivos gravados em assets/img/.' : 'Pronto.';
}

iniciar().catch((e) => {
  status.textContent = 'Erro: ' + e.message;
  console.error(e);
});
