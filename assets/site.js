(() => {
  const d = document, root = d.documentElement;
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  addEventListener('load', () => root.classList.add('suave'));
  const $ = (s, el = d) => el.querySelector(s), $$ = (s, el = d) => [...el.querySelectorAll(s)];

  /* ---------- um só rAF por imagem para tudo o que o scroll conduz */
  const aoScroll = []; let pedido = false;
  const tique = () => { pedido = false; aoScroll.forEach(f => f()); };
  addEventListener('scroll', () => { if (!pedido) { pedido = true; requestAnimationFrame(tique); } }, { passive: true });
  addEventListener('resize', () => requestAnimationFrame(tique));
  const limita = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

  /* ---------- cabeçalho em pílula: esconde a descer, volta a subir */
  const topo = $('[data-topo]'), barra = $('[data-barra]'), hero = $('[data-hero]');
  let antes = scrollY;
  const btn = $('[data-menu-btn]'), menu = $('[data-menu]');
  aoScroll.push(() => {
    const y = scrollY, aberto = btn && btn.getAttribute('aria-expanded') === 'true';
    // a pílula fica sempre visível, no telemóvel e no PC
    d.body.classList.add('topo-visivel');
    antes = y;
    if (barra) {
      barra.classList.toggle('on', y > (hero ? hero.offsetHeight * .6 : 160));
      // presa ao ecrã; quando o rodapé entra, sobe com ele e pousa-lhe em cima
      const rod = $('.rodape'), vh = innerHeight;
      const sobe = rod ? Math.max(0, vh - rod.getBoundingClientRect().top) : 0;
      barra.classList.toggle('segue', sobe > 0);
      barra.style.setProperty('--sobe', sobe + 'px');
    }
  });
  tique();

  if (btn && menu) {
    const fecha = () => {
      btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Abrir menu');
      menu.classList.remove('aberto'); setTimeout(() => { if (!menu.classList.contains('aberto')) menu.hidden = true; }, 450);
    };
    btn.addEventListener('click', () => {
      if (btn.getAttribute('aria-expanded') === 'true') return fecha();
      menu.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('aberto')));
      btn.setAttribute('aria-expanded', 'true'); btn.setAttribute('aria-label', 'Fechar menu');
    });
    $$('a', menu).forEach(a => a.addEventListener('click', fecha));
    addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('aberto')) { fecha(); btn.focus(); } });
    d.addEventListener('click', e => { if (menu.classList.contains('aberto') && !topo.contains(e.target)) fecha(); });
  }

  /* ---------- título: cada linha entra inteira, sem partir as letras */
  const cin = $('[data-cin]');
  const mostraTitulo = () => {
    if (!cin) return;
    cin.classList.remove('escondido');
    requestAnimationFrame(() => requestAnimationFrame(() => cin.classList.add('entra')));
    const ac = $('[data-hero-acoes]');
    setTimeout(() => ac && ac.classList.remove('escondido'), calmo ? 0 : 650);
  };

  /* ---------- filme do hero: fotografias reais em fundido */
  const slides = $$('.slide', $('[data-slides]') || d.createElement('div'));
  let iSlide = 0, timer = null, parado = false;
  const avanca = () => {
    if (slides.length < 2) return;
    const a = slides[iSlide]; iSlide = (iSlide + 1) % slides.length; const b = slides[iSlide];
    a.classList.add('sai'); a.classList.remove('on'); b.classList.add('on');
    setTimeout(() => a.classList.remove('sai'), 1000);
  };
  const corre = () => { clearInterval(timer); if (!parado && !calmo) timer = setInterval(avanca, 6000); };
  const pausa = null;
  pausa && pausa.addEventListener('click', () => {
    parado = !parado; pausa.classList.toggle('parado', parado);
    pausa.setAttribute('aria-label', parado ? 'Retomar imagens' : 'Pausar imagens');
    $$('.slide img').forEach(i => i.style.animationPlayState = parado ? 'paused' : 'running');
    corre();
  });
  d.addEventListener('visibilitychange', () => { if (d.hidden) clearInterval(timer); else corre(); });

  /* ---------- abertura dentro do site (como na Azul Properties): as fotografias já correm,
     o B é caiado em três passagens por cima da imagem, o nome sobe, e o logótipo voa para a pílula */
  const intro = $('[data-intro]');
  const logoTopo = $('.topo .marca .logo');
  const semIntro = () => { root.classList.add('intro-feito'); logoTopo && logoTopo.classList.remove('espera'); hero && hero.classList.remove('a-abrir'); mostraTitulo(); };
  if (intro) {
    // corre sempre que a página inicial carrega, também no recarregar
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (!location.hash) scrollTo(0, 0);
    corre();
    if (calmo || location.hash) semIntro();
    else {
      hero.classList.add('a-abrir'); logoTopo && logoTopo.classList.add('espera');
      setTimeout(() => intro.classList.add('corre'), 120);   // três passagens de trincha
      setTimeout(() => intro.classList.add('nome'), 620);    // o nome sobe
      setTimeout(() => {                                     // voo: o B do ecrã vai para o B da pílula
        const de = $('.i-simb', intro), para = logoTopo && logoTopo.querySelector('path');
        const svg = $('[data-intro-svg]', intro);
        intro.classList.add('sai-nome');
        hero.classList.remove('a-abrir');
        const pousa = () => {
          if (pousa.feito) return; pousa.feito = true;
          logoTopo && logoTopo.classList.add('pousou');     // o B da pílula aparece no mesmo instante
          logoTopo && logoTopo.classList.remove('espera');
          root.classList.add('intro-feito');                 // e o B que voou sai sem fundido
          setTimeout(() => logoTopo && logoTopo.classList.remove('pousou'), 900);
        };
        if (de && para && svg) {
          const a = de.getBoundingClientRect(), b = para.getBoundingClientRect(), s = b.height / a.height, r = svg.getBoundingClientRect();
          svg.style.transformOrigin = `${a.left - r.left}px ${a.top - r.top}px`;
          svg.getBoundingClientRect();
          svg.style.transform = `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${s})`;
          svg.addEventListener('transitionend', e => { if (e.propertyName === 'transform') pousa(); }, { once: true });
          setTimeout(pousa, 1000);
        } else pousa();
        setTimeout(mostraTitulo, 350);                       // o título entra enquanto o B voa
      }, 1500);
    }
  } else if (cin) { mostraTitulo(); corre(); }

  /* ---------- títulos palavra a palavra, por trás de uma máscara */
  $$('h2.revela').forEach(h => {
    let k = 0; h.classList.add('palavras'); h.classList.remove('revela');
    const parte = el => [...el.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = d.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(w => {
          if (!w) return; if (/^\s+$/.test(w)) { frag.append(' '); return; }
          const o = d.createElement('span'); o.className = 'pw';
          const i = d.createElement('span'); i.style.setProperty('--k', k++); i.textContent = w; o.append(i); frag.append(o);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) parte(n);
    });
    parte(h);
  });

  /* ---------- parágrafos que se escrevem com o scroll, palavra a palavra */
  const scrubs = $$('[data-scrub]').map(el => {
    const ws = el.textContent.trim().split(/\s+/);
    el.textContent = ''; ws.forEach((w, i) => { const s = d.createElement('span'); s.className = 'sw'; s.textContent = w; el.append(s, i < ws.length - 1 ? ' ' : ''); });
    return { el, xs: $$('.sw', el) };
  });
  if (scrubs.length) aoScroll.push(() => scrubs.forEach(({ el, xs }) => {
    if (calmo) { xs.forEach(x => x.classList.add('on')); return; }
    const r = el.getBoundingClientRect(), vh = innerHeight;
    if (r.top > vh * 1.1 || r.bottom < -vh * .5) return;
    const n = Math.round(limita((vh * .9 - r.top) / (vh * .5 + r.height * .6)) * xs.length);
    xs.forEach((x, i) => x.classList.toggle('on', i < n));
  }));

  /* ---------- números que contam */
  const conta = el => {
    const fim = el.textContent, alvo = parseFloat(fim.replace(',', '.')); if (calmo || isNaN(alvo)) return;
    const t0 = performance.now(), dur = 1300;
    const f = t => { const p = limita((t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = p < 1 ? (alvo * e).toFixed(1).replace('.', ',') : fim; if (p < 1) requestAnimationFrame(f); };
    el.textContent = '0,0'; requestAnimationFrame(f);
  };

  /* ---------- revelar ao chegar (threshold 0, sem rootMargin negativo) */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('ve'); io.unobserve(e.target);
    $$('[data-conta]', e.target).forEach(conta);
  }), { threshold: 0 });
  $$('.revela, .palavras, .doc, .abre-foto, .cartao, .prev, .cporta, .placa, .prova-in').forEach(el => io.observe(el));

  /* ---------- a fotografia do capítulo abre de moldura a sangrar; parallax leve nas outras */
  const cap = $('[data-cap]'), para = $$('[data-paralaxe]'), nome = $('[data-desliza]');
  if (!calmo) aoScroll.push(() => {
    const vh = innerHeight;
    if (cap) { const r = cap.getBoundingClientRect(); cap.style.setProperty('--a', limita((vh - r.top) / (vh * .85)).toFixed(4)); }
    para.forEach(p => { const r = p.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) return;
      const k = (r.top + r.height / 2 - vh / 2) / vh; p.style.setProperty('--py', (k * -36).toFixed(1) + 'px'); });
    if (nome) { const r = nome.getBoundingClientRect(); nome.style.setProperty('--nx', ((r.top - vh / 2) / vh * 60).toFixed(1) + 'px'); }
  });
  tique();

  /* ---------- imagens vivas: acompanham o rato */
  if (matchMedia('(hover: hover)').matches && !calmo) {
    $$('.viva').forEach(v => {
      v.addEventListener('pointermove', e => {
        const r = v.getBoundingClientRect();
        v.style.setProperty('--mx', ((e.clientX - r.left) / r.width - .5) * -10 + 'px');
        v.style.setProperty('--my', ((e.clientY - r.top) / r.height - .5) * -10 + 'px');
      });
      v.addEventListener('pointerleave', () => { v.style.removeProperty('--mx'); v.style.removeProperty('--my'); });
    });
  }

  /* ---------- pista com setas */
  const pista = $('[data-pista]');
  if (pista) {
    const passo = dir => pista.scrollBy({ left: dir * pista.clientWidth * .8, behavior: calmo ? 'auto' : 'smooth' });
    $('[data-pista-ant]')?.addEventListener('click', () => passo(-1));
    $('[data-pista-seg]')?.addEventListener('click', () => passo(1));
  }

  /* ---------- horas de Sintra e do Dubai; o céu do arco segue a hora */
  const horas = $$('[data-hora]');
  if (horas.length) {
    const ceu = $('[data-ceu]');
    const tic = () => {
      horas.forEach(h => { h.textContent = new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit', timeZone: h.dataset.hora }).format(new Date()); });
      if (ceu) {
        const hd = +new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Dubai' }).format(new Date());
        const noite = hd < 6 || hd >= 19, ocaso = (hd >= 17 && hd < 19) || (hd >= 6 && hd < 8);
        const mn = +new Intl.DateTimeFormat('en-GB', { minute: 'numeric', timeZone: 'Asia/Dubai' }).format(new Date());
        const hora = hd + mn / 60;
        ceu.style.setProperty('--c1', noite ? '#16291f' : ocaso ? '#ead2b8' : '#efe9dc');
        ceu.style.setProperty('--c2', noite ? '#2c4a3d' : ocaso ? '#c98a5c' : '#E8E2D5');
        ceu.style.setProperty('--h', noite ? '#0f1f18' : '#d8ccb6');
        // o sol nasce às 6 e põe-se às 18; a lua faz o mesmo caminho à noite
        const fase = noite ? ((hora + 24 - 18) % 24) / 12 : (hora - 6) / 12;
        const alt = Math.sin(Math.min(1, Math.max(0, fase)) * Math.PI);
        ceu.querySelector('[data-astro]')?.style.setProperty('--ay', (72 - alt * 50).toFixed(1) + '%');
        ceu.querySelector('[data-astro]')?.style.setProperty('--ac', noite ? '#E8E2D5' : ocaso ? '#B06F3F' : '#FAF8F3');
      }
    };
    tic(); setInterval(tic, 20000);
  }

  /* ---------- filtros da lista */
  const f = $('[data-filtros]');
  if (f) {
    const cards = $$('[data-grelha] .cartao'), cont = $('[data-contagem]'), vazio = $('[data-vazio]');
    const aplica = () => {
      const t = f.tipo.value, z = f.zona.value, [pmin, pmax] = (f.preco.value || '0-1e12').split('-').map(Number);
      let n = 0;
      cards.forEach(c => {
        const ok = (!t || c.dataset.tipo === t) && (!z || c.dataset.zona === z) && (+c.dataset.preco >= pmin && +c.dataset.preco <= pmax);
        c.hidden = !ok; if (ok) n++;
      });
      cont.textContent = n; vazio.hidden = n > 0;
    };
    f.addEventListener('change', aplica);
  }

  /* ---------- galeria da ficha: uma fotografia de cada vez, para o lado; toque abre o ecrã inteiro */
  const gp = $('[data-gal-pista]');
  if (gp) {
    const n = $('[data-gal-n]'), itens = $$('.gal-item', gp), total = itens.length;
    const ant = $('[data-gal-ant]'), seg = $('[data-gal-seg]');
    const atual = () => Math.round(gp.scrollLeft / gp.clientWidth);
    const vai = i => gp.scrollTo({ left: Math.max(0, Math.min(total - 1, i)) * gp.clientWidth, behavior: calmo ? 'auto' : 'smooth' });
    const marca = () => { const i = atual(); n.textContent = i + 1; ant && (ant.disabled = i === 0); seg && (seg.disabled = i >= total - 1); };
    gp.addEventListener('scroll', marca, { passive: true }); marca();
    ant && ant.addEventListener('click', () => vai(atual() - 1));
    seg && seg.addEventListener('click', () => vai(atual() + 1));
    gp.addEventListener('keydown', e => { if (e.key === 'ArrowRight') vai(atual() + 1); if (e.key === 'ArrowLeft') vai(atual() - 1); });

    const lupa = $('[data-lupa]'), lp = $('[data-lupa-pista]'), ln = $('[data-lupa-n]');
    let montada = false, origem = null;
    const monta = () => {
      if (montada) return; montada = true;
      itens.forEach(it => {
        const im = $('img', it), f = d.createElement('figure'), i2 = d.createElement('img');
        i2.alt = im.alt; i2.decoding = 'async'; i2.loading = 'lazy';
        i2.srcset = im.srcset; i2.sizes = '100vw'; i2.src = im.src; f.append(i2); lp.append(f);
      });
    };
    const li = () => Math.round(lp.scrollLeft / lp.clientWidth);
    const lvai = i => lp.scrollTo({ left: Math.max(0, Math.min(total - 1, i)) * lp.clientWidth, behavior: calmo ? 'auto' : 'smooth' });
    const lmarca = () => { const i = li(); ln.textContent = i + 1; $('[data-lupa-ant]').disabled = i === 0; $('[data-lupa-seg]').disabled = i >= total - 1; };
    lp.addEventListener('scroll', lmarca, { passive: true });
    const abre = i => {
      monta(); origem = d.activeElement; lupa.hidden = false; d.body.style.overflow = 'hidden';
      lp.scrollLeft = i * lp.clientWidth; lmarca(); $('[data-lupa-x]').focus();
    };
    const fecha = () => { const i = li(); lupa.hidden = true; d.body.style.overflow = ''; gp.scrollLeft = i * gp.clientWidth; marca(); origem && origem.focus && origem.focus(); };
    itens.forEach((it, i) => it.addEventListener('click', () => abre(i)));
    $('[data-lupa-x]').addEventListener('click', fecha);
    $('[data-lupa-ant]').addEventListener('click', () => lvai(li() - 1));
    $('[data-lupa-seg]').addEventListener('click', () => lvai(li() + 1));
    addEventListener('keydown', e => {
      if (lupa.hidden) return;
      if (e.key === 'Escape') fecha();
      if (e.key === 'ArrowRight') lvai(li() + 1);
      if (e.key === 'ArrowLeft') lvai(li() - 1);
    });
  }
})();
