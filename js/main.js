/* =========================================================
   T Dogs · eBook "Os 7 erros"
   Comportamento da página. O livro 3D mora em livro3d.js e só
   é carregado depois que o conteúdo já está na tela.
   ========================================================= */

/* ---------------------------------------------------------
   CONFIGURAÇÃO: é aqui que se troca preço e link de compra.
   checkout: link do Hotmart, Kiwify, Eduzz, Mercado Pago etc.
   Enquanto não houver checkout, os botões abrem o Direct do
   Instagram da T Dogs.
   --------------------------------------------------------- */
const CONFIG = {
  preco: 27, // em reais: 27 aparece como "R$ 27"; 27.9 aparece como "R$ 27,90"
  checkout: 'https://ig.me/m/tdogsadestramento',
};

const raiz = document.documentElement;
raiz.classList.add('js');

const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;

// O Chrome pode descartar um IntersectionObserver que nada no código referencia.
// Todos ficam guardados aqui, vivos enquanto a página estiver aberta.
const observadores = [];
const observar = (callback, opcoes) => {
  const obs = new IntersectionObserver(callback, opcoes);
  observadores.push(obs);
  return obs;
};

/* ---------- entradas no scroll ----------
   Itens com data-revelar entram juntos quando o grupo deles (o elemento
   pai) aparece na tela, cada um com um pequeno atraso pela posição
   (--ordem). Sem IntersectionObserver ou com movimento reduzido, tudo já
   aparece no lugar. */

const revelaveis = [...document.querySelectorAll('[data-revelar]')];
const grupos = new Map();

revelaveis.forEach((el) => {
  const pai = el.parentElement;
  if (!grupos.has(pai)) grupos.set(pai, []);
  const grupo = grupos.get(pai);
  el.style.setProperty('--ordem', String(grupo.length));
  grupo.push(el);
});

if (calmo || !('IntersectionObserver' in window)) {
  revelaveis.forEach((el) => el.classList.add('is-visivel'));
} else {
  const obsRevelar = observar((entradas) => {
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      grupos.get(e.target).forEach((el) => el.classList.add('is-visivel'));
      obsRevelar.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  grupos.forEach((_, pai) => obsRevelar.observe(pai));
}

/* ---------- preço, links de compra e ano ---------- */

const precoFormatado = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: Number.isInteger(CONFIG.preco) ? 0 : 2,
}).format(CONFIG.preco);

document.querySelectorAll('[data-preco]').forEach((el) => { el.textContent = precoFormatado; });

document.querySelectorAll('[data-comprar]').forEach((a) => {
  a.href = CONFIG.checkout;
  if (/^https?:/.test(CONFIG.checkout)) a.rel = 'noopener';
});

document.querySelectorAll('[data-ano]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

/* ---------- topo ----------
   O topo é transparente. Três estados, por IntersectionObserver:
   is-rolado   a página saiu do início: liga o desfoque atrás do topo
   is-escuro   um bloco azul ou preto está passando por baixo do topo
   is-compacto o hero saiu da tela (no celular, o botão dá lugar à barra) */

const topo = document.querySelector('[data-topo]');
const sentinela = document.createElement('div');
sentinela.setAttribute('aria-hidden', 'true');
sentinela.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:8px;pointer-events:none';
document.body.prepend(sentinela);

observar(([e]) => {
  topo.classList.toggle('is-rolado', !e.isIntersecting);
}).observe(sentinela);

// Uma linha de 1px na altura do meio do topo: o bloco escuro que cruza
// essa linha é o que está embaixo da logo e do botão.
const escuros = [...document.querySelectorAll('[data-tema="escuro"]')];
let obsTema = null;

function vigiarTema() {
  if (obsTema) obsTema.disconnect();
  const meio = Math.round(topo.getBoundingClientRect().height / 2);
  const abaixo = Math.max(0, window.innerHeight - meio - 1);
  const embaixo = new Set();
  obsTema = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => (e.isIntersecting ? embaixo.add(e.target) : embaixo.delete(e.target)));
    topo.classList.toggle('is-escuro', embaixo.size > 0);
  }, { rootMargin: `-${meio}px 0px -${abaixo}px 0px` });
  escuros.forEach((el) => obsTema.observe(el));
}

vigiarTema();

let esperaTema = 0;
window.addEventListener('resize', () => {
  clearTimeout(esperaTema);
  esperaTema = setTimeout(vigiarTema, 150);
});

/* ---------- os 7 erros ---------- */

const lista = document.querySelector('[data-erros]');

if (lista) {
  const botoes = [...lista.querySelectorAll('.erro')];
  const numero = document.querySelector('[data-placar-n]');
  const mensagem = document.querySelector('[data-placar-msg]');
  const anuncio = document.querySelector('[data-placar-anuncio]');
  const limpar = [...document.querySelectorAll('[data-placar-limpar]')];

  const textos = (n) => {
    if (n === 0) return 'Toque nos erros que você reconhece. O resultado aparece aqui.';
    if (n <= 2) return 'Poucos pontos para ajustar. Corrigidos com consistência, eles já mudam bastante a convivência.';
    if (n <= 4) return 'Seu cão provavelmente está recebendo sinais trocados. Isso tem ajuste, e o eBook mostra como.';
    if (n <= 6) return 'É mais comum do que parece. Comece por um de cada vez: o eBook mostra o ajuste de cada ponto.';
    return 'Você marcou todos. Ótimo ponto de partida: agora você sabe o que ajustar, e o eBook mostra como.';
  };

  const atualizar = () => {
    const n = botoes.filter((b) => b.getAttribute('aria-pressed') === 'true').length;
    numero.textContent = String(n);
    mensagem.textContent = textos(n);
    anuncio.textContent = `Você reconhece ${n} de 7. ${textos(n)}`;
    limpar.forEach((b) => { b.hidden = n === 0; });
    if (!calmo) {
      numero.classList.remove('is-pulso');
      void numero.offsetWidth; // reinicia a animação
      numero.classList.add('is-pulso');
    }
  };

  botoes.forEach((b) => {
    b.addEventListener('click', () => {
      const marcado = b.getAttribute('aria-pressed') === 'true';
      b.setAttribute('aria-pressed', String(!marcado));
      atualizar();
    });
  });

  limpar.forEach((botao) => botao.addEventListener('click', () => {
    botoes.forEach((b) => b.setAttribute('aria-pressed', 'false'));
    atualizar();
    botoes[0].focus();
  }));
}

/* ---------- mitos: o risco atravessa as frases ao entrar na tela ---------- */

const mitos = document.querySelector('[data-mitos]');

if (mitos) {
  observar((entradas, obs) => {
    if (entradas.some((e) => e.isIntersecting)) {
      mitos.classList.add('is-visto');
      obs.disconnect();
    }
  }, { threshold: 0.3 }).observe(mitos);
}

/* ---------- fotos de "quem somos": clicar troca a da frente ----------
   As duas fotos são botões. O clique troca as classes is-frente/is-tras e
   a passagem é animada com FLIP: mede onde cada foto estava, troca, mede
   onde ficou e anima só o transform entre os dois pontos. A que vem para
   a frente sobe num arco; a que vai para trás encolhe e gira de leve,
   como uma carta voltando para o fundo do baralho. Um clique no meio da
   animação parte da posição atual, sem pulo. */

const galeria = document.querySelector('[data-fotos]');

if (galeria) {
  const fotos = [...galeria.querySelectorAll('[data-foto]')];
  const emAndamento = new Map();
  const dicaFotos = document.querySelector('[data-dica-fotos]');
  if (dicaFotos && matchMedia('(pointer: coarse)').matches) dicaFotos.textContent = 'Toque nas fotos para trocar';

  const trocarFotos = () => {
    const antes = new Map(fotos.map((f) => [f, f.getBoundingClientRect()]));
    emAndamento.forEach((animacao) => animacao.cancel());
    emAndamento.clear();

    fotos.forEach((f) => {
      f.classList.toggle('is-frente');
      f.classList.toggle('is-tras');
    });

    if (calmo || !fotos[0].animate) return;

    fotos.forEach((f) => {
      const de = antes.get(f);
      const para = f.getBoundingClientRect();
      const dx = de.left - para.left;
      const dy = de.top - para.top;
      const escala = de.width / para.width;
      const meio = (escala + 1) / 2;
      const vemPraFrente = f.classList.contains('is-frente');

      const arco = vemPraFrente
        ? `translate(${dx * 0.5}px, ${dy * 0.5 - para.height * 0.1}px) scale(${meio * 1.04}) rotate(-4deg)`
        : `translate(${dx * 0.5}px, ${dy * 0.5 + para.height * 0.04}px) scale(${meio * 0.92}) rotate(3deg)`;

      const animacao = f.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${escala})` },
        { transform: arco, offset: 0.5 },
        { transform: 'none' },
      ], { duration: 680, easing: 'cubic-bezier(.2, .8, .2, 1)' });

      emAndamento.set(f, animacao);
      animacao.onfinish = () => emAndamento.delete(f);
    });
  };

  fotos.forEach((f) => f.addEventListener('click', trocarFotos));
}

/* ---------- barra de compra no celular ----------
   Aparece quando o botão do hero sai da tela e some onde já existe
   um botão de compra à vista (placar dos erros, oferta, rodapé).
   No mesmo momento o topo fica compacto e tira o próprio botão. */

const barra = document.querySelector('[data-barra]');

if (barra) {
  const hero = document.querySelector('[data-hero]');
  const zonas = [...document.querySelectorAll('[data-zona-sem-barra]')];
  const visiveis = new Set();
  let heroNaTela = true;
  const botaoBarra = barra.querySelector('a');

  const decidir = () => {
    const mostrar = !heroNaTela && visiveis.size === 0;
    barra.classList.toggle('is-visivel', mostrar);
    barra.setAttribute('aria-hidden', String(!mostrar));
    botaoBarra.tabIndex = mostrar ? 0 : -1;
  };

  observar(([e]) => {
    heroNaTela = e.isIntersecting;
    topo.classList.toggle('is-compacto', !heroNaTela);
    decidir();
  }, { rootMargin: '0px 0px -35% 0px' }).observe(hero);

  const obsZonas = observar((entradas) => {
    entradas.forEach((e) => (e.isIntersecting ? visiveis.add(e.target) : visiveis.delete(e.target)));
    decidir();
  });

  zonas.forEach((z) => obsZonas.observe(z));
}

/* ---------- livro 3D ---------- */

const palco = document.getElementById('palco');

function temWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

if (palco && temWebGL()) {
  const dica = palco.querySelector('[data-dica]');
  if (dica && matchMedia('(pointer: coarse)').matches) dica.textContent = 'Deslize para girar';

  const carregar = () => {
    import('./livro3d.js')
      .then((m) => m.montarLivro(palco, { calmo }))
      .catch((erro) => {
        // Sem 3D, a capa estática continua no lugar.
        console.warn('Livro 3D indisponível:', erro);
      });
  };

  if ('requestIdleCallback' in window) requestIdleCallback(carregar, { timeout: 1200 });
  else setTimeout(carregar, 200);
}
