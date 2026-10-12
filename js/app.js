/* =========================================================
   Portfolio Joris Galland — scrolling slides
   HTML/CSS/JS + GSAP (ScrollTrigger, ScrollToPlugin)
   ========================================================= */
(() => {
  'use strict';

  const CONFIG = {
    email: 'joris.galland@outlook.fr',
    linkedin: 'https://www.linkedin.com/in/joris-galland/',
  };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const hasGsap = !!window.gsap;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isPhone = () => matchMedia('(max-width: 820px)').matches;
  const animate = hasGsap && !reduced;

  if (hasGsap) gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  const body = document.body;
  const abs = $$('.ab');
  const boards = abs.map(a => $('.ab__board', a));
  const state = { u: 1, current: 0, grain: true };

  /* -------------------------------------------------------
     Build: selection frames, split titles, links
     ------------------------------------------------------- */
  const CURSOR_SVG = '<svg class="sframe__cursor" viewBox="0 0 32 32" aria-hidden="true"><path class="cursor__arrow" d="M4 3v19.5l5.3-4.9 3.6 8.2 3.4-1.5-3.6-8H20z"/><path class="cursor__plus" d="M24 19v9M19.5 23.5h9"/></svg>';
  $$('[data-frame]').forEach(f => {
    f.insertAdjacentHTML('beforeend',
      '<span class="sframe__s sframe__s--t"></span><span class="sframe__s sframe__s--r"></span><span class="sframe__s sframe__s--b"></span><span class="sframe__s sframe__s--l"></span>' +
      ['tl', 'tm', 'tr', 'bl', 'bm', 'br'].map(h => `<i class="h h--${h}" data-h="${h}"></i>`).join('') + CURSOR_SVG);
  });

  // studio mark, small, in the corner of every chapter divider
  $$('.ab__board.divider').forEach(d => d.insertAdjacentHTML('beforeend',
    '<svg class="divider__mark rv" viewBox="0 0 132 136" aria-hidden="true"><use href="#gs-mark"/></svg>'));

  $$('[data-split]').forEach(el => {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    // chars are grouped per word: a title may only wrap between words, never inside one
    el.innerHTML = text.trim().split(/\s+/).map(w =>
      `<span class="word" aria-hidden="true">${[...w].map(ch => `<span class="char">${ch}</span>`).join('')}</span>`).join(' ');
  });

  const SVGNS = 'http://www.w3.org/2000/svg';
  $$('.anno__arrows path.draw-dash').forEach(p => {
    const len = p.getTotalLength();
    const tip = p.getPointAtLength(len), back = p.getPointAtLength(len - 6);
    const a = Math.atan2(tip.y - back.y, tip.x - back.x), arm = 20, spread = 0.6;
    const pt = d => `${(tip.x - arm * Math.cos(a + d)).toFixed(1)} ${(tip.y - arm * Math.sin(a + d)).toFixed(1)}`;
    const head = document.createElementNS(SVGNS, 'path');
    head.setAttribute('d', `M${pt(spread)} L${tip.x.toFixed(1)} ${tip.y.toFixed(1)} L${pt(-spread)}`);
    head.setAttribute('class', 'arrow-head');
    head.setAttribute('stroke-dasharray', 'none');
    head.setAttribute('stroke-linejoin', 'round');
    p.after(head);
  });

  $$('.js-linkedin').forEach(a => { a.href = CONFIG.linkedin; });
  $$('.js-email').forEach(s => { s.textContent = CONFIG.email; });

  /* -------------------------------------------------------
     Layout: 1 design px = viewport / 1920 (phones: / 1000)
     ------------------------------------------------------- */
  function layout() {
    const w = document.documentElement.clientWidth;
    state.u = isPhone() ? w / 1000 : w / 1920;
    document.documentElement.style.setProperty('--u', state.u + 'px');
    placeSphere();
    alignKicker();
  }
  const measureCtx = document.createElement('canvas').getContext('2d');
  // The sphere stands in for the "o" of Portfolio (as in the PDF cover): a circle as tall as a capital,
  // centred on the lowercase letters, with an ink gap on each side like the one between the other letters.
  const SPHERE = { d: 213 / 274, cx: 137.5 / 274, cy: 111.5 / 222, ratio: 222 / 274 }; // circle inside lampe.webp
  function charBox(node, i) { const r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + 1); return r.getBoundingClientRect(); }
  function placeSphere() {
    const gap = $('.cover__o'), word = $('.cover__word'), t = $('.cover__title');
    if (!gap || !word) return;
    const texts = [...word.childNodes].filter(n => n.nodeType === 3 && n.data.trim());
    const before = texts[0], after = texts[texts.length - 1]; // "Portf" | "lio"
    const cs = getComputedStyle(word), ctx = measureCtx;
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = ch => ctx.measureText(ch);
    const inkR = (node, i) => charBox(node, i).left + m(node.data[i]).actualBoundingBoxRight;
    const inkL = (node, i) => charBox(node, i).left - m(node.data[i]).actualBoundingBoxLeft;
    const letterGap = parseFloat(cs.fontSize) * .085; // as measured around the sphere on the PDF cover
    const capH = m('H').actualBoundingBoxAscent, xo = m('o');
    const D = capH * 1.04;
    // widen / narrow the slot so that f ● l get the same gaps as the other letters
    const free = inkL(after, 0) - inkR(before, before.length - 1);
    gap.style.width = Math.max(0, gap.getBoundingClientRect().width + (D + 2 * letterGap - free)) + 'px';
    const fx = inkR(before, before.length - 1), lx = inkL(after, 0);
    const box = charBox(before, 0), fA = m('H').fontBoundingBoxAscent, fD = m('H').fontBoundingBoxDescent;
    const base = box.top + (box.height - (fA + fD)) / 2 + fA;
    const cy = base - (xo.actualBoundingBoxAscent - xo.actualBoundingBoxDescent) / 2;
    // relative to the word's layout box, so a running intro tween (y offset) cannot skew the result
    const w = D / SPHERE.d, wr = word.getBoundingClientRect();
    t.style.setProperty('--sphere-w', w + 'px');
    t.style.setProperty('--sphere-x', (word.offsetLeft + (fx + lx) / 2 - wr.left - SPHERE.cx * w) + 'px');
    t.style.setProperty('--sphere-y', (word.offsetTop + cy - wr.top - SPHERE.cy * w * SPHERE.ratio) + 'px');
  }
  // "Graphic Design" and "Portfolio" share the same optical left edge:
  // compensate the different side bearings of the G and the P.
  function inkLeft(char, el) {
    const cs = getComputedStyle(el);
    measureCtx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    return -measureCtx.measureText(char).actualBoundingBoxLeft;
  }
  function alignKicker() {
    const k = $('.cover__kicker'), w = $('.cover__word');
    if (!k || !w) return;
    k.style.marginLeft = (inkLeft('P', w) - inkLeft('G', k)) + 'px';
  }

  /* -------------------------------------------------------
     Navigation
     ------------------------------------------------------- */
  function gotoAb(i) {
    i = Math.max(0, Math.min(abs.length - 1, i));
    let y = abs[i].getBoundingClientRect().top + window.scrollY;
    // narrow desktops: land the slide just below the docked bar when the screen has room for it
    if (!isPhone() && i > 0 && i < abs.length - 1) {
      const need = 10 + 40 + 8 - 110 * state.u;
      if (need > 0) y -= Math.min(need, Math.max(0, innerHeight - abs[i].offsetHeight));
    }
    if (animate) {
      const dur = Math.min(1.6, 0.6 + Math.abs(window.scrollY - y) / 6000);
      gsap.to(window, { scrollTo: { y, autoKill: true }, duration: dur, ease: 'power3.inOut' });
    } else {
      window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    }
  }
  const gotoId = id => { const i = abs.findIndex(a => a.id === id); if (i > -1) gotoAb(i); };

  function trackCurrent() {
    const line = innerHeight * 0.4;
    let cur = 0;
    abs.forEach((a, i) => { if (a.getBoundingClientRect().top <= line) cur = i; });
    state.current = cur;
  }
  window.addEventListener('scroll', () => { trackCurrent(); hideCtx(); }, { passive: true });

  /* -------------------------------------------------------
     Prompt bar — under the cover frame, docked at the top
     while scrolling, back down on "A BIENTÔT !"
     ------------------------------------------------------- */
  const bar = $('#prompt');
  const slotCover = $('#slotCover');
  const slotEnd = $('#slotEnd');
  const fin = $('#fin');
  const dock = { end: 0 };
  let endMode = false;
  function placeBar() {
    const vh = innerHeight;
    const h = bar.offsetHeight;
    const TOP = 10;
    const bottomLimit = vh - h - (isPhone() ? 12 : 22);
    const coverY = Math.min(slotCover.getBoundingClientRect().top, bottomLimit);
    const sticky = Math.max(TOP, coverY);
    const endY = Math.min(slotEnd.getBoundingClientRect().top, bottomLimit);
    const wantEnd = fin.getBoundingClientRect().top < vh * 0.5;
    if (wantEnd !== endMode) {
      endMode = wantEnd;
      if (animate) gsap.to(dock, { end: wantEnd ? 1 : 0, duration: .75, ease: 'power3.inOut', overwrite: true });
      else dock.end = wantEnd ? 1 : 0;
    }
    const y = sticky + (endY - sticky) * dock.end;
    bar.style.transform = `translate(-50%, ${y.toFixed(1)}px)`;
    bar.classList.toggle('is-top', dock.end < .5 && coverY <= TOP + 1);
    bar.classList.toggle('at-cover', dock.end < .5 && coverY > TOP + 1); // home button hidden while resting on the cover
  }
  if (hasGsap) gsap.ticker.add(placeBar);
  else (function loop() { placeBar(); requestAnimationFrame(loop); })();
  window.addEventListener('scroll', placeBar, { passive: true });
  window.addEventListener('resize', placeBar);

  /* -------------------------------------------------------
     Custom cursor
     ------------------------------------------------------- */
  const cursor = $('#cursor');
  if (finePointer) body.classList.add('has-cursor');
  const setCX = hasGsap ? gsap.quickSetter(cursor, 'x', 'px') : v => { cursor.style.left = v + 'px'; };
  const setCY = hasGsap ? gsap.quickSetter(cursor, 'y', 'px') : v => { cursor.style.top = v + 'px'; };
  window.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    setCX(e.clientX); setCY(e.clientY);
    const b = e.target.closest('.ab__board');
    const overUi = !b || e.target.closest('.prompt, .ctx, .lightbox, .modal');
    cursor.classList.toggle('is-visible', !overUi);
    cursor.classList.toggle('on-light', !!b && b.dataset.theme === 'light');
    if (b && b.classList.contains('cover')) {
      const br = b.getBoundingClientRect();
      b.style.setProperty('--mx', ((e.clientX - br.left) / br.width * 100).toFixed(1) + '%');
      b.style.setProperty('--my', ((e.clientY - br.top) / br.height * 100).toFixed(1) + '%');
    }
  }, { passive: true });
  document.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));
  window.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
  window.addEventListener('pointerup', () => cursor.classList.remove('is-down'));

  /* -------------------------------------------------------
     Draggable frame handles (elastic spring back)
     ------------------------------------------------------- */
  let dragging = null;
  document.addEventListener('pointerdown', e => {
    const h = e.target.closest('.site .sframe .h');
    if (!h) return;
    e.preventDefault();
    const frame = h.closest('.sframe');
    if (hasGsap) gsap.killTweensOf(frame);
    dragging = { h: h.dataset.h, frame, x: e.clientX, y: e.clientY };
    h.setPointerCapture(e.pointerId);
  });
  document.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - dragging.x, dy = e.clientY - dragging.y;
    const f = dragging.frame, h = dragging.h;
    if (h.includes('l')) f.style.setProperty('--el', -dx);
    if (h.includes('r')) f.style.setProperty('--er', dx);
    if (h[0] === 't') f.style.setProperty('--et', -dy);
    if (h[0] === 'b') f.style.setProperty('--eb', dy);
  });
  const endDrag = () => {
    if (!dragging) return;
    const f = dragging.frame;
    dragging = null;
    if (hasGsap) gsap.to(f, { '--el': 0, '--er': 0, '--et': 0, '--eb': 0, duration: reduced ? 0 : 1.3, ease: 'elastic.out(1, 0.32)' });
    else ['--el', '--er', '--et', '--eb'].forEach(k => f.style.setProperty(k, 0));
  };
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);

  /* -------------------------------------------------------
     Toast / clipboard / share modal
     ------------------------------------------------------- */
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toastEl = $('#toast');
  function toast(msg) {
    toastEl.textContent = msg;
    const br = bar.getBoundingClientRect();
    toastEl.style.bottom = br.bottom > innerHeight - 90 ? (innerHeight - br.top + 12) + 'px' : '';
    toastEl.classList.add('is-on');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove('is-on'), 2200);
  }
  async function copy(text, label) {
    try {
      // a pending permission prompt must not leave the visitor without feedback
      await Promise.race([navigator.clipboard.writeText(text), new Promise((_, rej) => setTimeout(rej, 1000))]);
      toast(label || `Copied ${text}`);
    } catch {
      const t = document.createElement('textarea');
      t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { /* ignore */ }
      t.remove();
      if (ok) toast(label || `Copied ${text}`); else openShare();
    }
  }

  const modal = $('#modal');
  const modalWin = $('#modalWin');
  let lastFocus = null;
  function openShare() {
    lastFocus = document.activeElement;
    modalWin.innerHTML = `
      <div class="mw__head"><span>Share · Portfolio-Joris-GALLAND</span><button class="lightbox__close" data-action="modal-close" aria-label="Fermer">✕</button></div>
      <div class="mw__body">
        <span class="mw__script">Travaillons ensemble</span>
        <div class="mw__field"><input value="${esc(CONFIG.email)}" readonly aria-label="Email"><button class="btn-light" data-action="copy-email">Copy</button></div>
        <div class="mw__row"><span class="presence__avatar">JG</span><div><b>Joris Galland</b><small>Graphic Designer</small></div></div>
        <div class="pp__btns">
          <a class="btn-ghost" href="mailto:${esc(CONFIG.email)}?subject=${encodeURIComponent('Votre portfolio')}">Write an email ↗</a>
          <a class="btn-ghost" href="${esc(CONFIG.linkedin)}" target="_blank" rel="noopener">Open LinkedIn ↗</a>
        </div>
      </div>`;
    modal.hidden = false;
    if (animate) gsap.fromTo(modalWin, { y: 20, opacity: 0, scale: .98 }, { y: 0, opacity: 1, scale: 1, duration: .35, ease: 'power3.out' });
    const f = modalWin.querySelector('button, a, input');
    if (f) f.focus();
  }
  function closeModal() { modal.hidden = true; if (lastFocus) lastFocus.focus(); }
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  /* -------------------------------------------------------
     Lightbox (Preview)
     ------------------------------------------------------- */
  const lb = $('#lightbox');
  const lbImg = $('#lbImg');
  const shots = $$('[data-gallery]');
  let lbIndex = 0;
  function openLightbox(el) {
    lbIndex = Math.max(0, shots.indexOf(el));
    lastFocus = document.activeElement;
    showLb();
    lb.hidden = false;
    body.style.overflow = 'hidden';
    if (animate) gsap.fromTo('.lightbox__win', { y: 30, opacity: 0, scale: .97 }, { y: 0, opacity: 1, scale: 1, duration: .4, ease: 'power3.out' });
    $('.lightbox__close', lb).focus();
  }
  function showLb() {
    const el = shots[lbIndex];
    const img = $('img', el);
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    $('#lbName').textContent = el.dataset.layer;
    $('#lbCount').textContent = `${lbIndex + 1} / ${shots.length}`;
    const [client, kind, tools] = (el.dataset.meta || '||').split('|');
    $('#lbMeta').innerHTML = `<span><b>Client</b> ${esc(client)}</span><span><b>Type</b> ${esc(kind)}</span><span><b>Outils</b> ${esc(tools)}</span>`;
    if (animate) gsap.fromTo(lbImg, { opacity: 0 }, { opacity: 1, duration: .3 });
  }
  const lbStep = d => { lbIndex = (lbIndex + d + shots.length) % shots.length; showLb(); };
  function closeLb() { lb.hidden = true; body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  shots.forEach(s => {
    s.setAttribute('tabindex', '0');
    s.setAttribute('role', 'button');
    s.addEventListener('click', () => openLightbox(s));
    s.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(s); } });
  });

  /* -------------------------------------------------------
     Context menu (§4.2)
     ------------------------------------------------------- */
  const ctx = $('#ctx');
  function hideCtx() { ctx.hidden = true; }
  $('#site').addEventListener('contextmenu', e => {
    e.preventDefault();
    const shot = e.target.closest('[data-gallery]');
    let html = `<div class="ctx__head">${esc(abs[state.current].dataset.name)}</div>`;
    if (shot) html += `<button data-action="preview" data-index="${shots.indexOf(shot)}"><span>Open preview</span></button>`;
    html += `
      <button data-action="copy-email"><span>Copy email</span></button>
      <button data-action="linkedin"><span>Open LinkedIn ↗</span></button>
      <hr>
      <button data-action="next"><span>Next slide</span><kbd>→</kbd></button>
      <button data-action="prev"><span>Previous slide</span><kbd>←</kbd></button>
      <button data-action="top"><span>Back to cover</span></button>
      <hr>
      <button data-action="toggle-grain"><span>${state.grain ? 'Hide' : 'Show'} grain</span><kbd>G</kbd></button>`;
    ctx.innerHTML = html;
    ctx.hidden = false;
    const w = ctx.offsetWidth, h = ctx.offsetHeight;
    ctx.style.left = Math.min(e.clientX, innerWidth - w - 8) + 'px';
    ctx.style.top = Math.min(e.clientY, innerHeight - h - 8) + 'px';
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.ctx')) hideCtx();
    if (!e.target.closest('#promptMore, #promptMenu')) $('#promptMenu').hidden = true;
  });

  /* -------------------------------------------------------
     Actions (event delegation on [data-action])
     ------------------------------------------------------- */
  function toggleGrain() {
    state.grain = !state.grain;
    body.classList.toggle('no-grain', !state.grain);
    toast(state.grain ? 'Grain on' : 'Grain off');
  }
  const ACTIONS = {
    goto: el => gotoId(el.dataset.target),
    share: openShare,
    'modal-close': closeModal,
    'copy-email': () => copy(CONFIG.email, `Email copié · ${CONFIG.email}`),
    linkedin: () => window.open(CONFIG.linkedin, '_blank', 'noopener'),
    preview: el => openLightbox(shots[+el.dataset.index] || shots[0]),
    next: () => gotoAb(state.current + 1),
    prev: () => gotoAb(state.current - 1),
    top: () => gotoAb(0),
    'toggle-grain': toggleGrain,
    'lb-close': closeLb,
    'lb-prev': () => lbStep(-1),
    'lb-next': () => lbStep(1),
  };
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const fn = ACTIONS[el.dataset.action];
    if (!fn) return;
    if (el.tagName === 'A') e.preventDefault();
    hideCtx();
    fn(el);
  });

  /* -------------------------------------------------------
     Prompt bar — "Generate"
     ------------------------------------------------------- */
  const promptInput = $('#promptInput');
  const promptReply = $('#promptReply');
  const promptMenu = $('#promptMenu');
  const goLabel = $('#promptGo span');

  // "~word" = generic word, weaker than a specific one (so "projet UI/UX" goes to UI/UX)
  const INTENTS = [
    { id: 'cover', words: ['cover', 'couverture', 'accueil', 'debut', 'home'] },
    { id: 'salut', words: ['salut', '~moi', 'propos', 'about', '~qui', '~joris', 'profil', 'bio', 'presentation', 'parcours'] },
    { id: 'sommaire', words: ['sommaire', 'contenu', '~tout', 'menu', 'index', 'liste', '~portfolio'] },
    { id: 'graphique', words: ['graphique', 'affiche', 'poster', 'psg', 'foot', 'autoportrait', 'montage', 'scolaire', '~projet'] },
    { id: 'appdesign', words: ['app', 'application', 'mobile', 'fibr', 'mode', 'smartphone'] },
    { id: 'logos', words: ['logo', 'logos', 'logofolio', 'folio', 'symbole'] },
    { id: 'singope', words: ['branding', 'brand', 'marque', 'singope', 'identite', 'charte', 'bento'] },
    { id: 'brandlogo', words: ['annotation', 'annote', 'cadre', 'vision', 'construction'] },
    { id: 'insta', words: ['social', 'insta', 'instagram', 'post', 'posts', 'reseaux', 'feed', 'intermarche'] },
    { id: 'food', words: ['food', 'burger', 'kebab', 'restaurant', 'naan', 'snack', 'livraison'] },
    { id: 'print', words: ['print', 'affichage', 'impression', 'flyer', 'magasin', 'rayon'] },
    { id: 'webdesign', words: ['web', 'site', 'website', 'ui', 'ux', 'interface', 'landing'] },
    { id: 'redesign', words: ['avant', 'apres', 'refonte', 'redesign', 'before', 'after'] },
    { id: 'pages', words: ['pages', 'principales', 'navigateur', 'browser'] },
    { id: 'fin', words: ['contact', 'contacter', 'mail', 'email', 'ecrire', 'embauche', 'embaucher', 'recrute', 'recruter', 'recrutement', 'hire', 'linkedin', 'bientot', 'travaillons', 'cv', 'joindre'] },
  ];
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ');
  function matchIntent(q) {
    const t = ' ' + norm(q) + ' ';
    let best = null, score = 0;
    INTENTS.forEach(it => {
      let s = 0;
      it.words.forEach(raw => {
        const weak = raw[0] === '~', w = weak ? raw.slice(1) : raw;
        if (t.includes(' ' + w + ' ') || t.includes(' ' + w + 's ')) s += weak ? 1 : 2;
        else if (!weak && w.length > 3 && t.includes(' ' + w)) s += 1; // word prefix: contact → contacter
      });
      if (s > score || (s === score && s > 0)) { score = s; best = it; }
    });
    return score > 0 ? best : null;
  }

  const SUGGESTIONS = [
    'Montre-moi le branding Singope',
    'Affiche les posts Instagram',
    'Ouvre le projet UI/UX',
    'Les créations print',
    'Comment contacter Joris ?',
  ];
  promptMenu.innerHTML = '<p>Try asking</p>' + SUGGESTIONS.map(s => `<button type="button" data-suggest="${esc(s)}"><svg viewBox="0 0 24 24"><path d="M10 3l1.6 4.4L16 9l-4.4 1.6L10 15l-1.6-4.4L4 9l4.4-1.6z" fill="currentColor"/></svg>${esc(s)}</button>`).join('');
  $('#promptMore').addEventListener('click', e => { e.stopPropagation(); promptMenu.hidden = !promptMenu.hidden; promptReply.hidden = true; });
  promptMenu.addEventListener('click', e => {
    const b = e.target.closest('[data-suggest]');
    if (!b) return;
    promptInput.value = b.dataset.suggest;
    promptMenu.hidden = true;
    generate();
  });
  let busy = false;
  $('#promptCancel').addEventListener('click', () => {
    promptInput.value = ''; promptReply.hidden = true; promptMenu.hidden = true;
    bar.classList.remove('is-generating'); goLabel.textContent = 'Generate'; busy = false;
    promptInput.blur();
  });

  function reply(html, ms = 3600) {
    promptReply.innerHTML = html;
    promptReply.hidden = false;
    if (animate) gsap.fromTo(promptReply, { y: bar.classList.contains('is-top') ? -10 : 10, opacity: 0 }, { y: 0, opacity: 1, duration: .35, ease: 'power3.out' });
    clearTimeout(promptReply._t);
    promptReply._t = setTimeout(() => { promptReply.hidden = true; }, ms);
  }
  function generate() {
    if (busy) return;
    const q = promptInput.value.trim() || promptInput.placeholder;
    busy = true;
    promptMenu.hidden = true;
    promptReply.hidden = true;
    bar.classList.add('is-generating');
    goLabel.textContent = 'Generating…';
    setTimeout(() => {
      if (!busy) return;
      busy = false;
      bar.classList.remove('is-generating');
      goLabel.textContent = 'Generate';
      let it = matchIntent(q);
      if (!it && /genere|creat/.test(norm(q))) it = INTENTS.find(i => i.id === 'sommaire');
      if (!it) {
        reply('Aucune slide ne correspond. Essaie&nbsp;: <b>branding</b>, <b>logo</b>, <b>posts</b>, <b>print</b>, <b>UI/UX</b> ou <b>contact</b>.', 4800);
        return;
      }
      const i = abs.findIndex(a => a.id === it.id);
      reply(`<span class="script">Voilà</span> → <b>${esc(abs[i].dataset.name)}</b>`);
      promptInput.value = '';
      promptInput.blur();
      gotoAb(i);
    }, reduced ? 200 : 950);
  }
  bar.addEventListener('submit', e => { e.preventDefault(); generate(); });

  // typing placeholder loop
  const PLACEHOLDERS = ['Génère un portfolio à l’aide de mes créat…', ...SUGGESTIONS];
  if (!reduced) {
    let p = 0, c = PLACEHOLDERS[0].length, dir = 0, hold = 60;
    setInterval(() => {
      if (document.activeElement === promptInput || promptInput.value) return;
      const text = PLACEHOLDERS[p];
      if (dir === 0) { if (--hold <= 0) dir = -1; return; }
      if (dir === -1) { c -= 2; if (c <= 0) { c = 0; p = (p + 1) % PLACEHOLDERS.length; dir = 1; } }
      else { c += 1; if (c >= PLACEHOLDERS[p].length) { c = PLACEHOLDERS[p].length; dir = 0; hold = 70; } }
      promptInput.placeholder = (dir === -1 ? text : PLACEHOLDERS[p]).slice(0, c) || ' ';
    }, 45);
  }

  /* -------------------------------------------------------
     Keyboard
     ------------------------------------------------------- */
  document.addEventListener('keydown', e => {
    const typing = e.target instanceof Element && e.target.closest('input, textarea');
    if (e.key === 'Escape') {
      if (!lb.hidden) return closeLb();
      if (!modal.hidden) return closeModal();
      if (!ctx.hidden) return hideCtx();
      if (typing) e.target.blur();
      return;
    }
    if (!lb.hidden) {
      if (e.key === 'ArrowRight') lbStep(1);
      if (e.key === 'ArrowLeft') lbStep(-1);
      return;
    }
    if (typing || !modal.hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    switch (e.key) {
      case 'g': case 'G': toggleGrain(); break;
      case '/': e.preventDefault(); promptInput.focus(); break;
      case 'ArrowRight': case 'PageDown': e.preventDefault(); gotoAb(state.current + 1); break;
      case 'ArrowLeft': case 'PageUp': e.preventDefault(); gotoAb(state.current - 1); break;
      case 'Home': e.preventDefault(); gotoAb(0); break;
      case 'End': e.preventDefault(); gotoAb(abs.length - 1); break;
    }
  });

  /* -------------------------------------------------------
     Brand logo annotations: hover highlights the logo part
     ------------------------------------------------------- */
  const anno = $('.anno');
  $$('.anno__note[data-hl]').forEach(n => {
    const target = document.getElementById(n.dataset.hl);
    n.addEventListener('mouseenter', () => {
      anno.classList.add('is-hl'); n.classList.add('is-on');
      if (hasGsap) gsap.to(target, { scale: 1.05, duration: .5, ease: 'power3.out', overwrite: 'auto' });
    });
    n.addEventListener('mouseleave', () => {
      anno.classList.remove('is-hl'); n.classList.remove('is-on');
      if (hasGsap) gsap.to(target, { scale: 1, duration: .5, ease: 'power3.out', overwrite: 'auto' });
    });
  });

  /* -------------------------------------------------------
     Pages Principales: live browser tabs
     ------------------------------------------------------- */
  const pageTabs = $$('.pages__list button');
  const pageImgs = $$('.browser__view img');
  const PATHS = ['', '/galerie', '/multi-angles', '/comparatif'];
  let pageIdx = 0, pageAuto = true, pageTween = null, pagesVisible = false;
  function showPage(i) {
    pageIdx = i;
    pageTabs.forEach((t, k) => { t.classList.toggle('is-active', k === i); t.setAttribute('aria-selected', k === i); });
    pageImgs.forEach((im, k) => im.classList.toggle('is-active', k === i));
    $('#browserPath').textContent = PATHS[i];
    if (hasGsap) {
      if (pageTween) pageTween.kill();
      gsap.set('#browserProgress', { width: 0 });
      if (pageAuto && !reduced) pageTween = gsap.to('#browserProgress', { width: '100%', duration: 4.5, ease: 'none', paused: !pagesVisible, onComplete: () => showPage((pageIdx + 1) % pageTabs.length) });
    }
  }
  pageTabs.forEach((t, i) => t.addEventListener('click', () => { pageAuto = false; showPage(i); }));

  /* -------------------------------------------------------
     Animations
     ------------------------------------------------------- */
  function frameParts(f) {
    return {
      h: $$('.sframe__s--t, .sframe__s--b', f),
      v: $$('.sframe__s--l, .sframe__s--r', f),
      handles: $$('.h', f),
      cursor: $('.sframe__cursor', f),
    };
  }
  function frameIn(tl, f, at = 0) {
    const p = frameParts(f);
    tl.fromTo(p.h, { scaleX: 0 }, { scaleX: 1, duration: .9, ease: 'power3.inOut' }, at)
      .fromTo(p.v, { scaleY: 0 }, { scaleY: 1, duration: .8, ease: 'power3.inOut' }, at + .12)
      .fromTo(p.handles, { scale: 0 }, { scale: 1, duration: .45, ease: 'back.out(3)', stagger: .05 }, at + .45)
      .fromTo(p.cursor, { x: 80, y: 60, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: .9, ease: 'power3.out' }, at + .55);
    return tl;
  }
  function drawPaths(tl, paths, at) {
    paths.forEach(p => {
      const len = p.getTotalLength();
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    });
    tl.to(paths, { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut', stagger: .15 }, at);
  }

  function drawDashed(tl, paths, at) {
    paths.forEach((p, i) => {
      const svg = p.ownerSVGElement;
      let defs = svg.querySelector('defs');
      if (!defs) { defs = document.createElementNS(SVGNS, 'defs'); svg.prepend(defs); }
      const len = p.getTotalLength();
      const id = 'mk' + Math.random().toString(36).slice(2, 8);
      const mask = document.createElementNS(SVGNS, 'mask');
      mask.id = id;
      mask.setAttribute('maskUnits', 'userSpaceOnUse');
      const mp = document.createElementNS(SVGNS, 'path');
      mp.setAttribute('d', p.getAttribute('d'));
      ['fill:none', 'stroke:#fff', 'stroke-width:14', 'stroke-linecap:round'].forEach(kv => { const [k, v] = kv.split(':'); mp.setAttribute(k, v); });
      mp.setAttribute('stroke-dasharray', len);
      mp.setAttribute('stroke-dashoffset', len);
      mask.appendChild(mp);
      defs.appendChild(mask);
      p.setAttribute('mask', `url(#${id})`);
      tl.to(mp, { attr: { 'stroke-dashoffset': 0 }, duration: 1.1, ease: 'power2.inOut' }, at + i * .2);
      const head = p.nextElementSibling;
      if (head && head.classList.contains('arrow-head')) tl.from(head, { opacity: 0, duration: .3 }, at + i * .2 + 1);
    });
  }

  function buildReveals() {
    boards.forEach((b, i) => {
      if (i === 0) return; // cover handled by intro
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
      const frame = $('.sframe', b);
      const chars = $$('.char', b);
      const rv = $$('.rv', b);
      const scripts = $$('.duo__script, .toc__label em, .ba__script', b);
      const shotsIn = $$('.shot, .browser, .logos__lockup, .hello__portrait', b);
      const draws = $$('.draw path, path.draw', b);

      if (frame) frameIn(tl, frame, 0);
      if (chars.length) tl.from(chars, { yPercent: 60, opacity: 0, duration: .8, stagger: .04 }, .25);
      if (rv.length) tl.from(rv, { y: 40, opacity: 0, duration: .9, stagger: .08 }, .1);
      if (scripts.length) tl.fromTo(scripts, { clipPath: 'inset(-20% 100% -40% -10%)' }, { clipPath: 'inset(-20% -10% -40% -10%)', duration: 1.1, ease: 'power2.inOut', stagger: .08, clearProps: 'clipPath' }, .45);
      if (shotsIn.length) tl.from(shotsIn, { y: 70, opacity: 0, duration: 1, stagger: .07 }, .2);
      if (draws.length) drawPaths(tl, draws, .7);

      const sub = $('.divider__sub', b);
      if (sub) tl.from(sub, { y: 24, opacity: 0, duration: .9 }, .7);

      if (b.classList.contains('toc')) tl.from($$('.toc__item', b), { opacity: 0, y: 30, duration: .8, stagger: .07 }, .35);
      if (b.classList.contains('anno')) {
        tl.from('.anno__symbol', { scale: .6, rotate: -20, opacity: 0, duration: 1, ease: 'back.out(1.6)' }, .1)
          .from('.anno__word', { x: 60, opacity: 0, duration: 1 }, .2)
          .from('.anno__head, .anno__note', { opacity: 0, y: 20, duration: .8, stagger: .1 }, .4);
        drawDashed(tl, $$('.draw-dash', b), .9);
      }
      if (b.classList.contains('ba')) {
        tl.from('.ba__dot', { scale: 0, transformOrigin: '50% 50%', duration: .35, ease: 'back.out(3)', stagger: .12 }, .55);
        tl.from('.ba__head', { opacity: 0, y: 30, duration: .8 }, 0)
          .from('.ba__tag', { scale: 0, duration: .6, ease: 'back.out(2.5)', stagger: .2 }, .8);
      }
      if (b.classList.contains('end')) {
        tl.from('.end__title', { opacity: 0, scale: .92, duration: 1.1 }, .35)
          .from('.end__note .script', { clipPath: 'inset(0 100% 0 0)', duration: 1, ease: 'power2.inOut', clearProps: 'clipPath' }, .9)
          .from('.end__app', { scale: 0, opacity: 0, duration: .8, ease: 'back.out(2)', stagger: .15 }, .6)
          .from('.end__cta > *', { y: 20, opacity: 0, duration: .7, stagger: .08 }, 1);
      }
      if (b.classList.contains('hello')) tl.from('.hello__note .script', { clipPath: 'inset(0 100% 0 0)', duration: 1, ease: 'power2.inOut', clearProps: 'clipPath' }, .6);

      const play = () => tl.play();
      ScrollTrigger.create({ trigger: b, start: 'top 80%', end: 'bottom 20%', onEnter: play, onEnterBack: play, onLeave: play });
    });

    // parallax & ambient motion
    gsap.to('.posters__a', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '#graphique', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.posters__b', { yPercent: 5, ease: 'none', scrollTrigger: { trigger: '#graphique', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.cover__mark', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '#cover', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.end__bg', { xPercent: -6, ease: 'none', scrollTrigger: { trigger: '#fin', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.end__app--ps', { y: -14, rotate: 18, duration: 3.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to('.end__app--ai', { y: 12, rotate: -6, duration: 2.7, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  }

  function watchPages() {
    if (!hasGsap) return;
    ScrollTrigger.create({
      trigger: '#pages', start: 'top 80%', end: 'bottom 20%',
      onToggle: self => { pagesVisible = self.isActive; if (pageTween) pagesVisible ? pageTween.play() : pageTween.pause(); },
    });
  }

  function coverIntro() {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    frameIn(tl, $('.sframe', boards[0]), .1);
    tl.from('.cover__kicker', { y: 30, opacity: 0, duration: .9 }, .35)
      .fromTo('.cover__word', { clipPath: 'inset(100% -5% -10% -5%)', y: 60 }, { clipPath: 'inset(-10% -5% -30% -5%)', y: 0, duration: 1.3, ease: 'power4.out', clearProps: 'clipPath' }, .45)
      .from('.cover__sphere', { scale: .4, opacity: 0, duration: 1.2, ease: 'back.out(1.4)' }, .8)
      .fromTo('.cover__sign', { clipPath: 'inset(-30% 100% -30% -10%)' }, { clipPath: 'inset(-30% -10% -30% -10%)', duration: 1.4, ease: 'power2.inOut', clearProps: 'clipPath' }, 1.2)
      .from('.cover__light', { opacity: 0, duration: 2 }, .6)
      .from('.cover__mark', { opacity: 0, rotate: -18, scale: .92, transformOrigin: '50% 50%', duration: 2.4, ease: 'power3.out' }, .4)
      .fromTo(bar, { opacity: 0 }, { opacity: 1, duration: .8 }, 1.4);
    gsap.to('.cover__sphere', { filter: 'drop-shadow(0 0 ' + Math.round(90 * state.u) + 'px rgba(255,255,255,.75))', duration: 2.4, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 2 });
  }

  /* -------------------------------------------------------
     Boot
     ------------------------------------------------------- */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) window.scrollTo(0, 0);
  layout();
  trackCurrent();

  const boot = $('#boot');
  const bootBar = $('#bootBar');
  let booted = false;
  function finishBoot() {
    if (booted) return;
    booted = true;
    layout();
    body.classList.remove('is-booting');
    try { sessionStorage.setItem('gs-boot', '1'); } catch (e) { /* private mode */ }
    if (!animate) {
      boot.remove();
      watchPages();
      showPage(0);
      return;
    }
    const logo = $('.boot__logo'), brand = $('.cover__brand');
    const z = brand.getBoundingClientRect();
    if (z.bottom > 0 && z.top < innerHeight) {
      // the loading-screen logo flies into the cover header and becomes it, while the screen dissolves
      const a = logo.getBoundingClientRect();
      gsap.set(brand, { opacity: 0 });
      gsap.timeline({ onComplete: () => { gsap.set(brand, { opacity: 1 }); boot.remove(); } })
        .to('.boot__bar', { opacity: 0, duration: .3 }, 0)
        .to(logo, { x: z.left - a.left, y: z.top - a.top, scale: z.width / a.width, transformOrigin: '0 0', duration: 1.05, ease: 'power3.inOut' }, 0)
        .call(() => boot.classList.add('is-leaving'), null, .2)
        .to(boot, { backgroundColor: 'rgba(0,0,0,0)', duration: .8, ease: 'power2.inOut' }, .2);
      gsap.delayedCall(.35, coverIntro);
    } else {
      // deep link to another slide: the logo lifts off, the panel wipes up
      gsap.timeline({ onComplete: () => boot.remove() })
        .to('.boot__inner', { y: -40, opacity: 0, duration: .5, ease: 'power2.in' }, 0)
        .to(boot, { clipPath: 'inset(0% 0% 100% 0%)', duration: .9, ease: 'power4.inOut' }, .2);
      gsap.delayedCall(.45, coverIntro);
    }
    buildReveals();
    watchPages();
    showPage(0);
    ScrollTrigger.refresh();
  }

  if (animate) {
    gsap.set(bar, { opacity: 0 });
    gsap.set(boot, { clipPath: 'inset(0% 0% 0% 0%)' });
    // logo intro: the two halves of the G lock into place around the same circle, the dot drops in,
    // then the mark slides left to make room for "Galland studio"
    const O = '68 93'; // centre of the G's circle, in the lockup's coordinates
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.set('.boot__logo', { xPercent: 36.9 }) // mark alone, centred
      .from('.boot__bowl, .boot__top', { opacity: 0, duration: .35, ease: 'none' }, 0)
      .from('.boot__bowl', { rotation: -200, svgOrigin: O, duration: 1.2 }, 0)
      .from('.boot__top', { rotation: 130, svgOrigin: O, duration: 1.2 }, .08)
      .from('.boot__dot', { y: -150, duration: .85, ease: 'bounce.out' }, .5)
      .from('.boot__dot', { opacity: 0, duration: .15, ease: 'none' }, .5)
      .to('.boot__logo', { xPercent: 0, duration: .9, ease: 'power3.inOut' }, 1.25)
      .to('#bootClipRect', { attr: { width: 340 }, duration: .9, ease: 'power3.inOut' }, 1.35)
      .from('.boot__word', { x: -60, duration: 1, ease: 'power3.out' }, 1.35);
    tl.eventCallback('onUpdate', () => { bootBar.style.width = (tl.progress() * 100).toFixed(1) + '%'; });
    let seen = null;
    try { seen = sessionStorage.getItem('gs-boot'); } catch (e) { /* private mode */ }
    if (seen) tl.timeScale(2); // already seen this session: same intro, twice as fast
    const skip = () => tl.progress(1);
    boot.addEventListener('pointerdown', skip, { once: true });
    window.addEventListener('keydown', skip, { once: true });
    Promise.all([
      new Promise(r => tl.eventCallback('onComplete', r)),
      Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 1500))]),
    ]).then(() => gsap.delayedCall(seen ? .1 : .35, finishBoot));
    setTimeout(finishBoot, 6000); // safety net (background tab, slow fonts)
  } else {
    finishBoot();
  }
  if (document.fonts) document.fonts.ready.then(layout);

  /* -------------------------------------------------------
     Resize
     ------------------------------------------------------- */
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { layout(); if (hasGsap) ScrollTrigger.refresh(); }, 80);
  });
})();
