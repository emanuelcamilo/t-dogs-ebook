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
  preco: 'R$ 27',
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

/* ---------- preço, links de compra e ano ---------- */

document.querySelectorAll('[data-preco]').forEach((el) => { el.textContent = CONFIG.preco; });

document.querySelectorAll('[data-comprar]').forEach((a) => {
  a.href = CONFIG.checkout;
  if (/^https?:/.test(CONFIG.checkout)) a.rel = 'noopener';
});

document.querySelectorAll('[data-ano]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

/* ---------- topo: ganha fundo quando a página rola ---------- */

const topo = document.querySelector('[data-topo]');
const sentinela = document.createElement('div');
sentinela.setAttribute('aria-hidden', 'true');
sentinela.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:8px;pointer-events:none';
document.body.prepend(sentinela);

observar(([e]) => {
  topo.classList.toggle('is-rolado', !e.isIntersecting);
}).observe(sentinela);

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

/* ---------- barra de compra no celular ----------
   Aparece quando o botão do hero sai da tela e some onde já existe
   um botão de compra à vista (placar dos erros, oferta, rodapé). */

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
