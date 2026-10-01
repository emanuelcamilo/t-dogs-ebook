/* =========================================================
   Livro 3D do hero (Three.js).
   Capa, lombada e contracapa vêm de assets/img/*.webp, geradas
   por ferramentas/gerar-imagens.html. Trocar a capa = trocar o
   arquivo, sem mexer aqui.
   ========================================================= */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const COR = {
  laranja: 0xF09135,
  azul: 0x1D49A6,
  papel: 0xF6F1E8,
};

// Proporção carta, a mesma do PDF (612 × 792 pt).
const W = 3.1;
const H = 4.0;
const D = 0.34;   // espessura total
const T = 0.028;  // espessura da capa

// Pose de repouso: capa em três quartos, lombada à mostra.
const REPOUSO = { x: 0.05, y: 0.5, z: 0.035 };
const VOLTA = Math.PI * 2;

function texturaPaginas(sentido) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#F7F2EA';
  x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 256; i += 2) {
    x.fillStyle = `rgba(110, 90, 70, ${0.05 + Math.random() * 0.12})`;
    if (sentido === 'vertical') x.fillRect(i, 0, 1, 256);
    else x.fillRect(0, i, 256, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function texturaSombra() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(95, 38, 0, 0.62)');
  g.addColorStop(0.45, 'rgba(95, 38, 0, 0.26)');
  g.addColorStop(1, 'rgba(95, 38, 0, 0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

// Observadores guardados no módulo para o coletor de lixo não descartá-los.
const vivos = [];

// easeOutQuart
const suave = (t) => 1 - Math.pow(1 - t, 4);

// Aproximação exponencial independente de frame rate.
const aproximar = (atual, alvo, rapidez, dt) => atual + (alvo - atual) * (1 - Math.exp(-rapidez * dt));

export async function montarLivro(palco, { calmo = false } = {}) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return false;
  }

  const toque = matchMedia('(pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, toque ? 1.75 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;

  const cena = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  cena.environmentIntensity = 0.6;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);

  const chave = new THREE.DirectionalLight(0xffffff, 1.5);
  chave.position.set(-5, 6, 9);
  const recorte = new THREE.DirectionalLight(0xffd6a8, 0.9);
  recorte.position.set(6, 1.5, -5);
  cena.add(chave, recorte, new THREE.AmbientLight(0xffffff, 0.2));

  // ---------- texturas ----------
  const carregador = new THREE.TextureLoader();
  const nomes = ['capa-ebook', 'lombada-ebook', 'contracapa-ebook'];
  const [capa, lombada, contracapa] = await Promise.all(
    nomes.map((n) => carregador.loadAsync(new URL(`../assets/img/${n}.webp`, import.meta.url).href)),
  );
  const aniso = renderer.capabilities.getMaxAnisotropy();
  for (const t of [capa, lombada, contracapa]) {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = aniso;
  }

  // ---------- materiais ----------
  const lisa = (cor, rugosidade = 0.6) => new THREE.MeshStandardMaterial({ color: cor, roughness: rugosidade });
  // capa plastificada: um verniz leve que pega o reflexo quando o livro gira
  const plastificada = (map) => new THREE.MeshPhysicalMaterial({
    map,
    roughness: 0.52,
    clearcoat: 0.55,
    clearcoatRoughness: 0.3,
  });

  const laranja = lisa(COR.laranja, 0.55);
  const azul = lisa(COR.azul, 0.55);
  const papel = lisa(COR.papel, 0.92);
  const bordaV = new THREE.MeshStandardMaterial({ map: texturaPaginas('vertical'), roughness: 0.95 });
  const bordaH = new THREE.MeshStandardMaterial({ map: texturaPaginas('horizontal'), roughness: 0.95 });

  // ---------- geometria ----------
  // ordem dos materiais no BoxGeometry: +x, -x, +y, -y, +z, -z
  const livro = new THREE.Group();

  const frente = new THREE.Mesh(
    new THREE.BoxGeometry(W, H, T),
    [laranja, laranja, laranja, laranja, plastificada(capa), papel],
  );
  frente.position.z = D / 2 - T / 2;

  const verso = new THREE.Mesh(
    new THREE.BoxGeometry(W, H, T),
    [azul, azul, azul, azul, papel, plastificada(contracapa)],
  );
  verso.position.z = -(D / 2 - T / 2);

  const dorso = new THREE.Mesh(
    new THREE.BoxGeometry(T, H, D),
    [azul, plastificada(lombada), azul, azul, azul, azul],
  );
  dorso.position.x = -W / 2 + T / 2;

  const larguraMiolo = W - T - 0.07;
  const miolo = new THREE.Mesh(
    new THREE.BoxGeometry(larguraMiolo, H - 0.1, D - T * 2),
    [bordaV, papel, bordaH, bordaH, papel, papel],
  );
  miolo.position.x = -W / 2 + T + larguraMiolo / 2;

  livro.add(frente, verso, dorso, miolo);

  const suporte = new THREE.Group();
  suporte.add(livro);
  cena.add(suporte);

  const sombra = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 1.45, W * 0.5),
    new THREE.MeshBasicMaterial({ map: texturaSombra(), transparent: true, depthWrite: false }),
  );
  sombra.rotation.x = -Math.PI / 2;
  sombra.position.y = -H / 2 - 0.42;
  cena.add(sombra);

  // estado do laço de desenho (declarado antes de enquadrar, que pede quadros)
  let inicio = 0;
  let naTela = true;
  let pedido = 0;
  let pronto = false;

  // ---------- enquadramento ----------
  function enquadrar() {
    const { width, height } = palco.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    // o livro ocupa ~63% da altura do palco: cabe dentro do anel e sobra ar para girar
    const alturaVista = H / 0.63;
    let distancia = alturaVista / 2 / tan;
    distancia = Math.max(distancia, (W * 1.7) / 2 / (tan * camera.aspect));
    camera.position.set(0, distancia * 0.1, distancia);
    camera.lookAt(0, -0.12, 0);
    camera.updateProjectionMatrix();
    // setSize limpa o canvas: com movimento reduzido o laço está parado e precisa de um quadro
    if (pronto) pedirQuadro();
  }

  enquadrar();
  const redimensionar = new ResizeObserver(enquadrar);
  redimensionar.observe(palco);
  vivos.push(redimensionar);

  // ---------- interação ----------
  const estado = {
    giro: 0,        // rotação acumulada pelo arraste
    velocidade: 0,
    arrastando: false,
    inclX: 0,
    inclY: 0,
    alvoX: 0,
    alvoY: 0,
  };

  if (!calmo && !toque) {
    palco.addEventListener('pointermove', (e) => {
      if (estado.arrastando) return;
      const r = palco.getBoundingClientRect();
      estado.alvoY = ((e.clientX - r.left) / r.width - 0.5) * 0.45;
      estado.alvoX = ((e.clientY - r.top) / r.height - 0.5) * 0.22;
    });
    palco.addEventListener('pointerleave', () => {
      estado.alvoX = 0;
      estado.alvoY = 0;
    });
  }

  let ultimoX = 0;
  let ultimoT = 0;

  canvas.addEventListener('pointerdown', (e) => {
    estado.arrastando = true;
    estado.velocidade = 0;
    ultimoX = e.clientX;
    ultimoT = performance.now();
    canvas.setPointerCapture(e.pointerId);
    palco.classList.add('is-arrastando', 'is-girado');
    pedirQuadro();
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!estado.arrastando) return;
    const agora = performance.now();
    const passo = (e.clientX - ultimoX) * 0.011;
    estado.giro += passo;
    estado.velocidade = (passo / Math.max(8, agora - ultimoT)) * 16.7;
    ultimoX = e.clientX;
    ultimoT = agora;
  });

  const soltar = () => {
    if (!estado.arrastando) return;
    estado.arrastando = false;
    palco.classList.remove('is-arrastando');
    // arraste parado há mais de 80ms não deve ganhar impulso
    if (performance.now() - ultimoT > 80) estado.velocidade = 0;
  };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);

  // Teclado: as setas giram o livro, como o arraste.
  palco.tabIndex = 0;
  palco.setAttribute('role', 'group');
  palco.setAttribute('aria-roledescription', 'livro 3D');
  palco.setAttribute('aria-label', `${palco.getAttribute('aria-label')} Use as setas do teclado para girar o livro.`);
  palco.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    estado.velocidade += e.key === 'ArrowRight' ? 0.09 : -0.09;
    palco.classList.add('is-girado');
    pedirQuadro();
  });

  // ---------- laço de desenho ----------
  const relogio = new THREE.Clock();
  const duracaoEntrada = calmo ? 0 : 1700;

  function pedirQuadro() {
    if (!pedido && naTela && !document.hidden) pedido = requestAnimationFrame(quadro);
  }

  function quadro(agora) {
    pedido = 0;
    const dt = Math.min(relogio.getDelta(), 0.05);
    const t = relogio.elapsedTime;

    const entrada = duracaoEntrada ? Math.min(1, (agora - inicio) / duracaoEntrada) : 1;
    const e = suave(entrada);

    if (!estado.arrastando) {
      estado.giro += estado.velocidade;
      estado.velocidade *= Math.exp(-4.2 * dt);
      if (Math.abs(estado.velocidade) < 0.004) {
        // sem impulso: a mola devolve o livro para a capa mais próxima
        estado.velocidade = 0;
        const alvo = Math.round(estado.giro / VOLTA) * VOLTA;
        estado.giro = aproximar(estado.giro, alvo, 5, dt);
      }
    }

    estado.inclX = aproximar(estado.inclX, estado.alvoX, 6, dt);
    estado.inclY = aproximar(estado.inclY, estado.alvoY, 6, dt);

    const flutua = calmo ? 0 : Math.sin(t * 1.15) * 0.07;

    // Saída do hero: quando o palco sobe para fora da tela, o livro vira um
    // pouco e mostra mais a lombada, como se acompanhasse o scroll.
    // (Só lê a posição do palco; o laço já roda a cada quadro.)
    let saida = 0;
    if (!calmo) {
      const caixa = palco.getBoundingClientRect();
      saida = Math.min(1, Math.max(0, -caixa.top / caixa.height));
      saida = saida * saida * (3 - 2 * saida); // suaviza começo e fim
    }

    suporte.position.y = flutua - (1 - e) * 0.9 + saida * 0.45;
    suporte.rotation.set(
      REPOUSO.x + estado.inclX + saida * 0.18,
      REPOUSO.y + estado.inclY + estado.giro - (1 - e) * 2.7 + saida * 0.6,
      REPOUSO.z + (calmo ? 0 : Math.sin(t * 0.7) * 0.012),
    );
    suporte.scale.setScalar(0.9 + e * 0.1);

    sombra.material.opacity = (0.85 - flutua * 1.6) * e;
    sombra.scale.setScalar(1 - flutua * 0.5);

    renderer.render(cena, camera);

    // Com movimento reduzido, só desenha enquanto houver algo mudando.
    const parado = !estado.arrastando && estado.velocidade === 0
      && Math.abs(estado.giro - Math.round(estado.giro / VOLTA) * VOLTA) < 1e-4;
    if (!calmo || !parado) pedirQuadro();
  }

  const visibilidade = new IntersectionObserver(([ent]) => {
    naTela = ent.isIntersecting;
    if (naTela) {
      relogio.getDelta();
      pedirQuadro();
    }
  });
  visibilidade.observe(palco);
  vivos.push(visibilidade);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      relogio.getDelta();
      pedirQuadro();
    }
  });

  canvas.addEventListener('webglcontextlost', (ev) => {
    ev.preventDefault();
    palco.classList.remove('is-3d');
  });

  // Primeiro quadro desenhado antes de mostrar: nada de canvas vazio piscando.
  renderer.compile(cena, camera);
  palco.append(canvas);
  inicio = performance.now();
  pronto = true;
  quadro(inicio);
  requestAnimationFrame(() => palco.classList.add('is-3d'));
  return true;
}
