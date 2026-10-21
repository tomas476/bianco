(() => {
  const d = document, root = d.documentElement;
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  addEventListener('load', () => root.classList.add('suave'));
  const $ = (s, el = d) => el.querySelector(s), $$ = (s, el = d) => [...el.querySelectorAll(s)];

  /* ---------- um só rAF por imagem para o que o scroll conduz */
  const aoScroll = []; let pedido = false;
  const tique = () => { pedido = false; aoScroll.forEach(f => f()); };
  const pede = () => { if (!pedido) { pedido = true; requestAnimationFrame(tique); } };
  addEventListener('scroll', pede, { passive: true });
  addEventListener('resize', pede);

  /* ---------- hero com altura fixa no telemóvel: a barra do browser a fechar e a abrir não o redimensiona.
     O 100svh do Safari já não mexe, mas há browsers dentro de apps que mudam a janela a cada scroll e o hero arrastava a página.
     Mede-se o 100svh uma vez, numa sonda que não depende do CSS ter chegado, e volta a medir-se só se a largura mudar
     (rodar o telemóvel) ou se a altura mudar mais do que uma barra de browser muda (ecrã dividido) */
  const barra = $('[data-barra]'), hero = $('[data-hero]');
  if (hero && matchMedia('(pointer: coarse)').matches) {
    // largura e altura do layout (clientWidth/clientHeight da raiz): o zoom de dois dedos e a barra do Safari não as mudam
    let w = 0, h = 0, fixo = '';
    const fixa = () => {
      const s = d.createElement('div');
      s.style.cssText = 'position:absolute;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none';
      d.body.append(s); const v = s.getBoundingClientRect().height; s.remove();
      w = root.clientWidth; h = root.clientHeight;
      if (v && v + 'px' !== fixo) { fixo = v + 'px'; root.style.setProperty('--hero-h', fixo); }
    };
    fixa();
    addEventListener('resize', () => { if (root.clientWidth !== w || Math.abs(root.clientHeight - h) > h * .25) fixa(); });
  }

  /* ---------- barra de contacto: na página inicial aparece depois do hero; nas outras já vem ligada do HTML */
  if (barra && hero) {
    // o limiar segue a altura do hero pelo ResizeObserver (numa rede lenta o WebKit corre este script antes de o CSS chegar),
    // e o scroll só lê o scrollY: nenhuma medida de layout a cada imagem
    let limiar = hero.offsetHeight * .6;
    const mede = () => { limiar = hero.offsetHeight * .6; };
    const ve = () => barra.classList.toggle('on', scrollY > limiar);
    if ('ResizeObserver' in window) new ResizeObserver(() => { mede(); ve(); }).observe(hero);
    else aoScroll.push(mede);
    aoScroll.push(ve);
    tique();
  }

  /* ---------- menu do telemóvel */
  const topo = $('[data-topo]'), btn = $('[data-menu-btn]'), menu = $('[data-menu]');
  if (btn && menu) {
    let yAbriu = 0;
    const fecha = () => {
      btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', btn.dataset.abrir || 'Abrir menu');
      menu.classList.remove('aberto'); setTimeout(() => { if (!menu.classList.contains('aberto')) menu.hidden = true; }, 450);
    };
    btn.addEventListener('click', () => {
      if (btn.getAttribute('aria-expanded') === 'true') return fecha();
      menu.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('aberto')));
      btn.setAttribute('aria-expanded', 'true'); btn.setAttribute('aria-label', btn.dataset.fechar || 'Fechar menu');
      yAbriu = scrollY;
    });
    $$('a', menu).forEach(a => a.addEventListener('click', fecha));
    addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('aberto')) { fecha(); btn.focus(); } });
    // no iPhone o click só chega ao document vindo de ligações e botões; o pointerdown chega de qualquer toque, também do que começa um deslize
    d.addEventListener('pointerdown', e => { if (menu.classList.contains('aberto') && !topo.contains(e.target)) fecha(); }, { passive: true });
    // e o painel não fica a flutuar por cima da página que rola por baixo dele
    aoScroll.push(() => { if (btn.getAttribute('aria-expanded') === 'true' && Math.abs(scrollY - yAbriu) > 24) fecha(); });
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

  /* ---------- filme do hero: fotografias reais em fundido.
     Fora do ecrã, ou com o separador escondido, o filme pára onde está: nem troca de fotografia nem Ken Burns a trabalhar
     por baixo do scroll. Ao voltar continua do mesmo ponto, com o tempo que faltava para a troca seguinte */
  const slides = $$('.slide', $('[data-slides]') || d.createElement('div'));
  let iSlide = 0, timer = null, desde = 0, falta = 6000, emVista = true;
  const avanca = () => {
    if (slides.length < 2) return;
    const a = slides[iSlide]; iSlide = (iSlide + 1) % slides.length; const b = slides[iSlide];
    a.classList.add('sai'); a.classList.remove('on'); b.classList.add('on');
    setTimeout(() => a.classList.remove('sai'), 1000);
  };
  const passo = () => { avanca(); desde = performance.now(); falta = 6000; timer = setTimeout(passo, 6000); };
  const corre = () => {
    if (calmo || slides.length < 2) return;
    if (timer) { clearTimeout(timer); timer = null; falta = Math.max(0, falta - (performance.now() - desde)); }
    const anda = emVista && !d.hidden;
    hero && hero.classList.toggle('parado', !anda);
    if (anda) { desde = performance.now(); timer = setTimeout(passo, falta); }
  };
  d.addEventListener('visibilitychange', corre);
  if (hero && 'IntersectionObserver' in window)
    new IntersectionObserver(([e]) => { if (e.isIntersecting !== emVista) { emVista = e.isIntersecting; corre(); } }).observe(hero);

  /* ---------- abertura dentro do site (como na Azul Properties): as fotografias já correm,
     o B é caiado em três passagens por cima da imagem, o nome sobe, e o logótipo voa para a pílula */
  const intro = $('[data-intro]');
  const logoTopo = $('.topo .marca .logo');
  const semIntro = () => { root.classList.add('intro-feito'); logoTopo && logoTopo.classList.remove('espera'); hero && hero.classList.remove('a-abrir'); mostraTitulo(); };
  if (intro) {
    // a abertura é para quem chega ao topo. Quem volta atrás ou recarrega a meio fica onde estava: o browser repõe o sítio,
    // mas só depois de este script correr, por isso cada entrada do histórico guarda a sua posição
    const tipo = (performance.getEntriesByType('navigation')[0] || {}).type;
    const guardado = history.state && typeof history.state.y === 'number' ? history.state.y : null;
    const guarda = () => { try { history.replaceState(Object.assign({}, history.state, { y: Math.max(0, Math.round(scrollY)) }), ''); } catch (e) {} };
    // guarda-se ao sair (toque numa ligação, recarregar, trocar de app) e não a cada paragem do scroll: para o Safari
    // cada replaceState é uma navegação dentro da página, e uma navegação pode voltar a abrir a barra que o scroll fechou
    d.addEventListener('click', guarda, true);
    addEventListener('pagehide', guarda);
    d.addEventListener('visibilitychange', () => { if (d.hidden) guarda(); });
    if (guardado === null) guarda();
    corre();
    if (calmo || location.hash || scrollY > 0 || ((tipo === 'reload' || tipo === 'back_forward') && guardado !== 0)) semIntro();
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
          // o B vai com a página e a pílula está presa ao ecrã: se a página rolar durante o voo, o destino medido já não serve
          addEventListener('scroll', pousa, { once: true, passive: true });
        } else pousa();
        setTimeout(mostraTitulo, 350);                       // o título entra enquanto o B voa
      }, 1500);
    }
  } else if (cin) { mostraTitulo(); corre(); }

  /* ---------- revelar ao chegar: títulos e fotografias, cada um como um bloco */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('ve'); io.unobserve(e.target);
  }), { threshold: 0 });
  $$('.revela').forEach(el => io.observe(el));

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

  /* ---------- horas de Sintra e do Dubai */
  const horas = $$('[data-hora]');
  if (horas.length) {
    const tic = () => horas.forEach(h => { const t = new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit', timeZone: h.dataset.hora }).format(new Date()); if (h.textContent !== t) h.textContent = t; });
    tic(); setInterval(tic, 20000);
  }

  /* ---------- filtros da lista: cada subsecção mostra a sua contagem e esconde-se quando fica vazia */
  const f = $('[data-filtros]');
  if (f) {
    const grupos = $$('[data-grupo]'), cont = $('[data-contagem]'), vazio = $('[data-vazio]');
    const procuraDoGrupo = grupos[0] && $('.cartao-procura', grupos[0]);
    const estado = () => [f.tipo.value, f.zona.value, f.preco.value].join('|');
    let feito = '||';
    const aplica = (rola = true) => {
      feito = estado();
      const t = f.tipo.value, z = f.zona.value, [pmin, pmax] = (f.preco.value || '0-1e12').split('-').map(Number);
      let total = 0;
      grupos.forEach(g => {
        let n = 0;
        $$('.cartao', g).forEach(c => {
          const ok = (!t || c.dataset.tipo === t) && (!z || c.dataset.zona === z) && (+c.dataset.preco >= pmin && +c.dataset.preco <= pmax);
          c.hidden = !ok; if (ok) n++;
        });
        g.hidden = n === 0; $('[data-grupo-n]', g).textContent = n; total += n;
      });
      cont.textContent = total; vazio.hidden = total > 0;
      // o «Não encontrou?» do primeiro grupo só fica com outro grupo depois dele: o fim da lista já tem um
      if (procuraDoGrupo) procuraDoGrupo.hidden = !grupos.slice(1).some(g => !g.hidden);
      // com a barra presa, a lista encolhe por cima do leitor: os resultados passam a começar logo por baixo da barra
      if (rola && f.classList.contains('preso')) {
        const alvo = grupos.find(g => !g.hidden) || vazio;
        scrollTo({ top: alvo.getBoundingClientRect().top + scrollY - f.getBoundingClientRect().bottom - 16, behavior: 'instant' });
      }
    };
    f.addEventListener('change', () => aplica());
    // quem volta de uma ficha encontra os filtros como os deixou (o browser repõe-nos): a lista filtra-se já,
    // antes de o browser repor a posição, para voltar ao mesmo cartão e não a outro
    if (estado() !== feito) aplica(false);
    addEventListener('pageshow', () => { if (estado() !== feito) aplica(false); });
    // presa ao topo: uma faixa de cal por cima, para as fotografias não passarem à volta da pílula.
    // numa rede lenta o WebKit corre este script antes de o CSS chegar e o top ainda é «auto»: 72 é o do telemóvel
    new IntersectionObserver(([e]) => f.classList.toggle('preso', e.boundingClientRect.top <= e.rootBounds.top),
      { threshold: [1], rootMargin: `-${(parseFloat(getComputedStyle(f).top) || 72) + 1}px 0px 0px 0px` }).observe(f);
  }

  /* ---------- galeria da ficha: uma fotografia de cada vez, para o lado; toque abre o ecrã inteiro */
  const gp = $('[data-gal-pista]');
  if (gp) {
    const n = $('[data-gal-n]'), itens = $$('.gal-item', gp), total = itens.length;
    const ant = $('[data-gal-ant]'), seg = $('[data-gal-seg]');
    const atual = () => Math.round(gp.scrollLeft / gp.clientWidth);
    const vai = i => gp.scrollTo({ left: Math.max(0, Math.min(total - 1, i)) * gp.clientWidth, behavior: calmo ? 'instant' : 'smooth' });
    // o scroll da galeria dá um evento por imagem: escreve-se só quando a fotografia muda
    let vista = -1;
    const marca = () => { const i = atual(); if (i === vista) return; vista = i; n.textContent = i + 1; ant && (ant.disabled = i === 0); seg && (seg.disabled = i >= total - 1); };
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
        i2.srcset = im.srcset; i2.sizes = '100vw'; i2.src = im.src; f.append(i2);
        const etq = $('.gal-etq', it); if (etq) f.append(etq.cloneNode(true));
        lp.append(f);
      });
    };
    const li = () => Math.round(lp.scrollLeft / lp.clientWidth);
    const lvai = i => lp.scrollTo({ left: Math.max(0, Math.min(total - 1, i)) * lp.clientWidth, behavior: calmo ? 'instant' : 'smooth' });
    let lvista = -1;
    const lmarca = () => { const i = li(); if (i === lvista) return; lvista = i; ln.textContent = i + 1; $('[data-lupa-ant]').disabled = i === 0; $('[data-lupa-seg]').disabled = i >= total - 1; };
    lp.addEventListener('scroll', lmarca, { passive: true });
    const abre = i => {
      monta(); origem = d.activeElement; lupa.hidden = false; d.body.style.overflow = 'hidden';
      lp.scrollLeft = i * lp.clientWidth; lmarca(); $('[data-lupa-x]').focus();
    };
    // fecha no sítio: a galeria salta para a fotografia vista, sem passar pelas do meio
    const fecha = () => { const i = li(); lupa.hidden = true; d.body.style.overflow = ''; gp.scrollTo({ left: i * gp.clientWidth, behavior: 'instant' }); marca(); origem && origem.focus && origem.focus({ preventScroll: true }); };
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
