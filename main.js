const CONFIG = {
  strands:    2,
  spacing:     27,
  turn:       0.21,
  radius:      0.2,
  radiusMax:  260,
  tilt:       24,

  snake:      0.85,
  axisHome:   0.5,

  orbitPad:    160,
  minClear:    6,
  deflect:     0.5,
  focusGain:   1,

  nameInMs:     1500,
  nameInDelay:    0,
  wordsInMs:    700,
  wordsInDelay:    800,
  ruleInMs:      1500,
  ruleInDelay:   0,
  heroOutVh:     0.3,

  heroClearPad:  0,
  heroGuard:    true,

  dotsInPx:     500,
  dotsStagger: 0.35,
  dotsFrom:      60,

  gapHelloVh:   0.7,
  beatStart:    0.9,
  beatSpan:    0.42,
  beatStagger: 0.55,
  shapeGain:    1.7,
  slideDist:    140,
  riseDist:       200,

  helloTilt:      -10,
  helloDots:      60,
  helloTurns:    2,
  helloPad:       100,
  helloLead:      200,
  helloSpin:      1,

  exitPush:     240,
  exitReach:    200,
  exitFade:       0,

  webDots:       58,
  webInner:      26,
  webSpread:    140,
  webSquash:   0.78,
  webLink:       96,
  webLinkAlpha: 0.5,

  tlStepVh:     1,
  tlHoldVh:    0.3,
  tlRevealVh:  0.8,
  tlStart:     0.6,

  flyX:        1200,
  flyArc:      -105,
  flyRot:        10,
  flyLag:         8,
  flyHold:      0.2,
  flyEase:        4,
  flySpan:        1,
  flyStart:    0.82,
  tlGapPx:      400,

  tlDots:         1,
  tlSpacing:     25,
  tlTurnPx:     300,
  tlRadius:      30,
  tlSize:       2.6,
  tlAlpha:        1,
  tlSpin:      0.01,

  stageVh:       3,
  stageSpan:    0.1,
  stLabel:      0,
  stRule:       0,
  stPhoto:      0.15,
  stTitle:      0.15,
  stQuote:      0.3,
  stQuoteSpan:  0.5,
  quoteFade:     8,

  voidVh:         2,
  darkInPx:      2000,
  darkOutPx:    100,
  darkDots:       0,

  cursorSize:      10,
  cursorRing:     16,
  cursorRadius:  300,
  cursorPush:     50,

  rotation:   0.0026,
  ease:       0.085,
  beatEase:       1,
  stretch:    0.022,
  stretchMax: 1.5,

  arrowDelayMs: 900,
  arrowFadePx:  220,

  colorNear:  '#AB978C',
  colorFar:   '#7B7F8A',
  size:       3.8,
  scaleFar:   0.42,
  alphaNear:  0.95,
  alphaFar:   0.16,
  frontDamp:  0.5,

  breakpoint: 860,
  radiusSm:   0.16,
  snakeSm:    0.35,
  axisHomeSm: 0.8,
};

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const back  = document.getElementById('field-back');
const front = document.getElementById('field-front');
const bx = back.getContext('2d');
const fx = front.getContext('2d');
const nav = document.getElementById('nav');
const scrollCue = document.getElementById('scrolldown');
const cursorEl = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');

if (cursorEl) document.documentElement.classList.add('has-pointer');

let lastFrame = 0;
function restoreCursor(why) {
  if (!document.documentElement.classList.contains('has-pointer')) return;
  document.documentElement.classList.remove('has-pointer');
  if (cursorEl) cursorEl.style.display = 'none';
  if (cursorRing) cursorRing.style.display = 'none';
  console.warn('[pointer] native cursor restored:', why);
}
window.addEventListener('error', () => restoreCursor('script error'));
window.addEventListener('unhandledrejection', () => restoreCursor('promise rejection'));
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') restoreCursor('escape pressed');
});
setInterval(() => {
  if (lastFrame && performance.now() - lastFrame > 1500) restoreCursor('frame loop stalled');
}, 1000);

let pointerX = -9999, pointerY = -9999;
let pointerSeen = false;

let vw = 0, vh = 0, docH = 0;
let dotCount = 0, radius = 0, snake = 0, axisHome = 0;

let target = 0;
let current = 0;
let velocity = 0;

let beatScroll = 0;

let focuses = [];
let paras   = [];

const heroName = document.querySelector('.hero__name');
const heroLabel = document.querySelector('.hero__eyebrow');
const heroRule = document.querySelector('.hero__rule');
let heroSpread = 0;
let heroDrop   = 0;
let heroGap    = 1;
let heroLabelBottom = 0;
let heroNameTop = 0;
let introStart = 0;
let lastVy = 0, lastSpread = 0;
let heroReady = false;

let beats = [];
let dotGroups = [];
let slots = new Map();
const SLOT_STRIDE = 1e6;
let exits = [];
let darkZones = [];
let stages = [];
let helixes = [];
let darkness = 0;
const webPts = [];

function splitText(el) {
  const mode = el.dataset.split;
  const text = el.textContent.trim();
  const parts = mode === 'chars' ? [...text] : text.split(/[ \n\r\t]+/);

  el.textContent = '';
  el.style.setProperty('--n', parts.length);
  parts.forEach((part, i) => {
    const outer = document.createElement('span');
    outer.className = 'sp-o';
    outer.style.setProperty('--i', i);
    const inner = document.createElement('span');
    inner.className = 'sp-i';
    inner.textContent = part;
    outer.appendChild(inner);
    el.appendChild(outer);
    if (mode !== 'chars' && i < parts.length - 1) {
      el.appendChild(document.createTextNode(' '));
    }
  });
}

document.querySelectorAll('[data-split]').forEach(splitText);

document.querySelectorAll('[data-spread]').forEach(el => {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  words.forEach((word, wi) => {
    const cls = wi === 0 ? 'w1' : 'w2';
    if (wi) {
      const gap = document.createElement('span');
      gap.className = cls;
      gap.textContent = '\u00A0';
      el.appendChild(gap);
    }
    for (const ch of word) {
      const s = document.createElement('span');
      s.className = cls;
      s.textContent = ch;
      el.appendChild(s);
    }
  });
});

function measure() {
  vw = window.innerWidth;
  vh = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  for (const [cv, ctx] of [[back, bx], [front, fx]]) {
    cv.width  = Math.round(vw * dpr);
    cv.height = Math.round(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const small = vw <= CONFIG.breakpoint;
  radius   = small ? vw * CONFIG.radiusSm : Math.min(vw * CONFIG.radius, CONFIG.radiusMax);
  snake    = small ? CONFIG.snakeSm : CONFIG.snake;
  axisHome = vw * (small ? CONFIG.axisHomeSm : CONFIG.axisHome);

  paras.forEach(p => { p.el.style.transform = ''; });

  const sy = window.scrollY;

  focuses = [...document.querySelectorAll('[data-focus]')].map(el => {
    const r = el.getBoundingClientRect();
    return { el, cx: r.left + r.width / 2, cy: r.top + sy + r.height / 2, w: r.width, h: r.height };
  }).sort((a, b) => a.cy - b.cy);

  paras = [...document.querySelectorAll('[data-par], [data-zoom]')].map(el => {
    const r = el.getBoundingClientRect();
    return {
      el,
      cy: r.top + sy + r.height / 2,
      par: parseFloat(el.dataset.par || 0),
      zoom: el.hasAttribute('data-zoom'),
    };
  });

  for (const f of focuses) {
    f.owner = paras.find(p => p.el === f.el || p.el.contains(f.el)) || null;
    f.room = Math.min(Math.max(1 - (f.w / vw - 0.6) / 0.35, 0), 1);
  }

  measureHero();

  beats = [...document.querySelectorAll('[data-beat]')].map(el => {
    const r = el.getBoundingClientRect();
    return {
      el, kind: el.dataset.beat,
      letters: el.dataset.beat === 'fly' ? [...el.querySelectorAll('.sp-i')] : null,
      x: r.left - (el._tx || 0),
      y: r.top + sy - (el._ty || 0),
      w: r.width, h: r.height,
    };
  });

  dotGroups = [...document.querySelectorAll('[data-dots]')].map(el => {
    const beat = beats.find(b => b.el === el) || null;
    const r = el.getBoundingClientRect();
    return {
      kind: el.dataset.dots, beat,
      x: r.left - (el._tx || 0),
      y: r.top + sy - (el._ty || 0),
      w: r.width, h: r.height,
    };
  });

  document.documentElement.style.setProperty('--hello-tilt', CONFIG.helloTilt + 'deg');
  document.documentElement.style.setProperty('--gap-hello', CONFIG.gapHelloVh);
  document.documentElement.style.setProperty('--void-vh', CONFIG.voidVh);
  document.documentElement.style.setProperty('--stage-vh', CONFIG.stageVh);
  document.documentElement.style.setProperty('--word-fade', CONFIG.quoteFade);

  document.documentElement.style.setProperty('--tl-step', CONFIG.tlStepVh);
  document.documentElement.style.setProperty('--tl-hold', CONFIG.tlHoldVh);
  document.documentElement.style.setProperty('--tl-gap', CONFIG.tlGapPx + 'px');


  helixes = [...document.querySelectorAll('[data-helix]')].map(el => {
    const r = el.getBoundingClientRect();
    return { cx: r.left + r.width / 2, y: r.top + sy, h: r.height };
  });

  stages = [...document.querySelectorAll('[data-stage]')].map(el => {
    const r = el.getBoundingClientRect();
    return { el, y: r.top + sy, h: r.height };
  });
  if (scrollCue) scrollCue.style.setProperty('--arrow-delay', CONFIG.arrowDelayMs + 'ms');
  if (cursorEl) cursorEl.style.setProperty('--cursor-size', CONFIG.cursorSize + 'px');
  if (cursorRing) cursorRing.style.setProperty('--cursor-ring', CONFIG.cursorRing + 'px');

  docH = document.documentElement.scrollHeight;
  dotCount = Math.min(Math.ceil((docH + vh * 2) / Math.max(CONFIG.spacing, 1)), 20000);

  slots = new Map();
  for (const g of dotGroups) {
    const n = Math.round(g.kind === 'wrap' ? CONFIG.helloDots : CONFIG.webDots);
    const rows = Math.ceil(n / CONFIG.strands);
    const first = Math.round((g.y + g.h / 2) / CONFIG.spacing) - Math.floor(rows / 2);
    const stagger = Math.min(Math.max(CONFIG.beatStagger, 0), 0.95);

    for (let k = 0; k < n; k++) {
      const strand = k % CONFIG.strands;
      const index = first + Math.floor(k / CONFIG.strands);
      if (index < 0 || index >= dotCount) continue;
      slots.set(strand * SLOT_STRIDE + index, {
        group: g,
        f: n === 1 ? 0 : k / (n - 1),
        k,
        delay: (k / n) * stagger,
      });
    }
  }

  darkZones = [...document.querySelectorAll('[data-dark]')].map(el => {
    const into = el.querySelector('.void--in');
    const outOf = el.querySelector('.void--out');
    const box = (n) => n ? n.getBoundingClientRect() : null;
    const a = box(into), b = box(outOf);
    return {
      inY: a ? a.top + sy : null,
      inH: a ? a.height : 0,
      outY: b ? b.top + sy : null,
      outH: b ? b.height : 0,
    };
  }).filter(z => z.inY !== null);

  exits = [...document.querySelectorAll('[data-exit]')].map(el => {
    const r = el.getBoundingClientRect();
    return { y: r.top + sy - (el._ty || 0), h: r.height };
  });

  moveElements();
  updateDarkness();
  updateStages();
  moveBeats();
  render();
}

function measureHero() {
  if (!heroName || !heroLabel) return;

  const w1 = heroLabel.querySelectorAll('.w1');
  const w2 = heroLabel.querySelectorAll('.w2');
  const nameBox  = heroName.getBoundingClientRect();
  const labelBox = heroLabel.getBoundingClientRect();

  const nameTop    = nameBox.top - lastVy;
  const nameBottom = nameBox.bottom - lastVy;

  heroLabelBottom = labelBox.bottom;
  heroNameTop = nameTop;
  heroGap = Math.max(nameTop - labelBox.bottom, 1);

  if (w1.length && w2.length) {
    const w1Right = w1[w1.length - 1].getBoundingClientRect().right + lastSpread;
    const w2Left  = w2[0].getBoundingClientRect().left - lastSpread;
    const restGap = w2Left - w1Right;

    const forClearance = (nameBox.width + CONFIG.heroClearPad - restGap) / 2;
    const forOffscreen = Math.max(w1Right, vw - w2Left) + 16;
    heroSpread = Math.max(0, forClearance, forOffscreen);
  } else {
    heroSpread = 0;
  }

  heroDrop = nameBottom + window.scrollY + 24;
}

const easeOut = t => 1 - Math.pow(1 - t, 3);

function setHero(pName, pWords, pRule) {
  if (!heroName || !heroLabel) return;

  const drop  = easeOut(Math.min(Math.max(pName, 0), 1));
  const close = easeOut(Math.min(Math.max(pWords, 0), 1));

  if (heroRule) {
    heroRule.style.setProperty('--rw', easeOut(Math.min(Math.max(pRule, 0), 1)).toFixed(4));
  }

  const vy = -heroDrop * (1 - drop);

  let c = close;
  if (CONFIG.heroGuard) {
    const cleared = Math.min(Math.max((heroNameTop + vy - heroLabelBottom) / heroGap, 0), 1);
    c = Math.min(c, cleared);
  }
  const spread = heroSpread * (1 - c);

  lastVy = vy;
  lastSpread = spread;
  heroName.style.setProperty('--vy', vy.toFixed(2) + 'px');
  heroLabel.style.setProperty('--dx', (-spread).toFixed(2) + 'px');
  heroLabel.style.setProperty('--px', spread.toFixed(2) + 'px');
}

const clamp01 = v => Math.min(Math.max(v, 0), 1);

const hexCache = new Map();
const mixCache = new Map();
function toRgb(hex) {
  let v = hexCache.get(hex);
  if (!v) {
    v = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
    hexCache.set(hex, v);
  }
  return v;
}
function depthColour(t) {
  const q = Math.round(clamp01(t) * 8);
  const key = CONFIG.colorFar + CONFIG.colorNear + q;
  let c = mixCache.get(key);
  if (!c) {
    const a = toRgb(CONFIG.colorFar), b = toRgb(CONFIG.colorNear), f = q / 8;
    c = `rgb(${Math.round(a[0] + (b[0] - a[0]) * f)},${Math.round(a[1] + (b[1] - a[1]) * f)},${Math.round(a[2] + (b[2] - a[2]) * f)})`;
    mixCache.set(key, c);
  }
  return c;
}

function beatProgress(docTop) {
  const top = docTop - beatScroll;
  return clamp01((vh * CONFIG.beatStart - top) / Math.max(vh * CONFIG.beatSpan, 1));
}

function updateDarkness() {
  let d = 0;
  for (const z of darkZones) {
    const inRun = Math.max(Math.min(CONFIG.darkInPx, z.inH - vh), 120);
    const arriving = clamp01((beatScroll - z.inY) / inRun);

    const outRun = Math.max(Math.min(CONFIG.darkOutPx, z.outH - vh), 120);
    const leaving = z.outY === null ? 0 : clamp01((beatScroll - z.outY) / outRun);
    d = Math.max(d, arriving * (1 - leaving));
  }
  darkness = d;
  document.documentElement.style.setProperty('--dark', d.toFixed(4));
}

function updateStages() {
  for (const st of stages) {
    const p = clamp01((beatScroll - st.y) / Math.max(st.h - vh, 1));
    const step = (from) => easeOut(clamp01((p - from) / Math.max(CONFIG.stageSpan, 0.01)));
    const s = st.el.style;

    s.setProperty('--w-label', (1 - step(CONFIG.stLabel)).toFixed(4));
    s.setProperty('--w-rule', step(CONFIG.stRule).toFixed(4));
    s.setProperty('--w-photo', (1 - step(CONFIG.stPhoto)).toFixed(4));
    s.setProperty('--w-title', (1 - step(CONFIG.stTitle)).toFixed(4));
    s.setProperty('--qp',
      clamp01((p - CONFIG.stQuote) / Math.max(CONFIG.stQuoteSpan, 0.01)).toFixed(4));
  }
}

function moveBeats() {
  for (const b of beats) {
    const p = easeOut(beatProgress(b.y));
    b.el.style.setProperty('--o', p.toFixed(3));

    if (b.kind === 'slide') {
      b.el._tx = (1 - p) * CONFIG.slideDist;
      b.el.style.setProperty('--tx', b.el._tx.toFixed(1) + 'px');
    } else if (b.kind === 'rise') {
      b.el._ty = (1 - p) * CONFIG.riseDist;
      b.el.style.setProperty('--ty', b.el._ty.toFixed(1) + 'px');
    } else if (b.kind === 'fly') {
      const raw = (vh * CONFIG.flyStart - (b.y - beatScroll))
                  / Math.max(vh * CONFIG.flySpan, 1);
      const reach = Math.abs(CONFIG.flyX);
      const lag = Math.max(CONFIG.flyLag, 0.01);
      const pw = Math.max(CONFIG.flyEase, 1);
      const hold = Math.min(Math.max(CONFIG.flyHold, 0), 0.9);

      /* Entry and exit get their own band with the hold between them, so no
         letter can start leaving until every letter has reached the centre. */
      const band = (1 - hold) / 2;
      const pIn  = clamp01(raw / band);
      const pOut = clamp01((raw - band - hold) / band);

      const ls = b.letters || [];
      const n = ls.length;
      for (let k = 0; k < n; k++) {
        const rank = n - 1 - k;              // last letter leads, first letter trails
        const tin  = clamp01((pIn  * (n + lag) - rank) / lag);
        const tout = clamp01((pOut * (n + lag) - rank) / lag);
        const u = tin - 1 + tout;
        const e = (u < 0 ? -1 : 1) * Math.pow(Math.abs(u), pw);
        ls[k].style.transform =
          'translate(' + (e * reach).toFixed(1) + 'px,'
                       + (u * u * CONFIG.flyArc).toFixed(1) + 'px) rotate('
                       + (-u * CONFIG.flyRot).toFixed(2) + 'deg)';
        ls[k].style.opacity = (1 - Math.abs(e)).toFixed(3);
      }
      b.el.style.setProperty('--o', 1);
    } else if (b.kind === 'step') {
      const q = clamp01((beatScroll - (b.y - vh * CONFIG.tlStart))
                        / Math.max(vh * CONFIG.tlRevealVh, 1));
      b.el.style.setProperty('--q', q.toFixed(4));
      b.el.style.setProperty('--o', 1);
    } else if (b.kind === 'pop') {
      b.el.querySelector('.hello__tilt')
        ?.style.setProperty('--pop', (0.94 + 0.06 * p).toFixed(3));
    }
  }
}

function wrapPoint(g, f, spin) {
  const cx = g.x + g.w / 2;
  const top = g.y - CONFIG.helloLead;
  const bottom = g.y + g.h + CONFIG.helloLead;
  const a = f * CONFIG.helloTurns * Math.PI * 2 + spin;
  const r = g.w / 2 + CONFIG.helloPad;
  const tilt = CONFIG.helloTilt * Math.PI / 180;

  const px = Math.sin(a) * r;
  const py = top + f * (bottom - top) - (g.y + g.h / 2);
  return {
    x: cx + px * Math.cos(tilt) - py * Math.sin(tilt),
    y: (g.y + g.h / 2) + px * Math.sin(tilt) + py * Math.cos(tilt),
    depth: Math.cos(a),
  };
}

function webPoint(g, k) {
  const cx = g.x + g.w / 2, cy = g.y + g.h / 2;
  const a = ((k * 0.6180339887) % 1) * Math.PI * 2;
  const r = CONFIG.webInner + Math.sqrt((k * 0.7548776662) % 1) * CONFIG.webSpread;
  return {
    x: cx + Math.cos(a) * (g.w / 2 + r),
    y: cy + Math.sin(a) * (g.h / 2 + r * CONFIG.webSquash),
    depth: 0,
  };
}

function axisAt(docY) {
  if (!focuses.length) return axisHome;

  let a = null, b = null;
  for (const f of focuses) {
    if (f.cy <= docY) a = f;
    else { b = f; break; }
  }

  let x;
  if (!a) x = b.cx;
  else if (!b) x = a.cx;
  else {
    let t = (docY - a.cy) / (b.cy - a.cy);
    t = t * t * (3 - 2 * t);
    x = a.cx + (b.cx - a.cx) * t;
  }
  return axisHome + (x - axisHome) * snake;
}

function render() {
  bx.clearRect(0, 0, vw, vh);
  fx.clearRect(0, 0, vw, vh);

  const lit = CONFIG.darkDots ? 1 : 1 - darkness;
  const entry = (CONFIG.dotsInPx > 0 ? Math.min(beatScroll / CONFIG.dotsInPx, 1) : 1) * lit;
  const stagger = Math.min(Math.max(CONFIG.dotsStagger, 0), 0.95);
  const window_ = 1 - stagger;

  webPts.length = 0;

  const phase = current * CONFIG.rotation;
  const strandGap = (Math.PI * 2) / CONFIG.strands;
  const sq = 1 + Math.min(Math.abs(velocity) * CONFIG.stretch, CONFIG.stretchMax);

  for (const f of focuses) {
    f.y = f.cy + (f.owner ? f.owner.ty || 0 : 0);
    const screenY = f.y - current;
    const d = Math.abs(screenY - vh / 2) / (vh * 0.62);
    f.act = Math.max(0, 1 - d * d);
  }

  if (entry > 0) for (let s = 0; s < CONFIG.strands; s++) {
    for (let i = 0; i < dotCount; i++) {
      const baseY = i * CONFIG.spacing;

      const approx = baseY - current;
      if (approx < -700 || approx > vh + 700) continue;

      const theta = i * CONFIG.turn + phase + s * strandGap;
      const st = Math.sin(theta), ct = Math.cos(theta);
      const near = ct > 0;

      let x = axisAt(baseY) + st * radius;
      let y = baseY + ct * CONFIG.tilt;

      let pull = 0;
      for (const f of focuses) {
        const rx = f.w / 2 + CONFIG.orbitPad;
        const ry = f.h / 2 + CONFIG.orbitPad;

        const gather = f.act * f.room;
        if (gather > 0.001) {
          const nx = (x - f.cx) / rx;
          const ny = (y - f.y) / ry;
          const d = Math.max(Math.abs(nx), Math.abs(ny));
          if (d < 1 && d >= 1e-4) {
            const push = 1 + (1 / d - 1) * gather * CONFIG.deflect;
            x = f.cx + nx * rx * push;
            y = f.y + ny * ry * push;
            pull = Math.max(pull, gather * (1 - d));
          }
        }

        if (!near) continue;

        const ex = f.w / 2 + CONFIG.minClear;
        const ey = f.h / 2 + CONFIG.minClear;
        const gx = (x - f.cx) / ex;
        const gy = (y - f.y) / ey;
        const gd = Math.max(Math.abs(gx), Math.abs(gy));
        if (gd < 1e-4) {
          x = f.cx + ex * (st >= 0 ? 1 : -1);
          y = f.y + ey * ct;
        } else if (gd < 1) {
          x = f.cx + gx * ex / gd;
          y = f.y + gy * ey / gd;
        }
      }

      let screenY = y - current;

      let ctEff = ct;
      let claimed = 0;

      const slot = slots.get(s * SLOT_STRIDE + i);
      if (slot) {
        const g = slot.group;
        const claim = clamp01((beatProgress(g.y) - slot.delay) / (1 - slot.delay || 1));
        if (claim > 0) {
          claimed = claim;
          const ce = easeOut(claim);
          const oy = g.beat ? (g.beat.el._ty || 0) : 0;
          const ox = g.beat ? (g.beat.el._tx || 0) : 0;
          const pt = g.kind === 'wrap'
            ? wrapPoint(g, slot.f, CONFIG.helloSpin ? phase : 0)
            : webPoint(g, slot.k);
          let tx = pt.x + ox;
          let ty = pt.y + oy - beatScroll;

          if (g.kind === 'web' && pointerSeen && CONFIG.cursorPush > 0) {
            const dx = tx - pointerX, dy = ty - pointerY;
            const dist = Math.hypot(dx, dy);
            if (dist < CONFIG.cursorRadius && dist > 0.01) {
              const force = (1 - dist / CONFIG.cursorRadius) * CONFIG.cursorPush * ce;
              tx += (dx / dist) * force;
              ty += (dy / dist) * force;
            }
          }

          x += (tx - x) * ce;
          screenY += (ty - screenY) * ce;
          if (g.kind === 'web' && claim > 0.05) webPts.push(x, screenY, claim);
          ctEff = ct + (pt.depth - ct) * ce;
        }
      }

      let exitFade = 1;
      if (!slot) {
        for (const ex of exits) {
          const ep = beatProgress(ex.y);
          if (ep <= 0) continue;
          const reach = ex.h / 2 + CONFIG.exitReach;
          const band = 1 - clamp01(Math.abs(baseY - (ex.y + ex.h / 2)) / reach);
          if (band <= 0) continue;
          const k = easeOut(ep) * band;
          x += CONFIG.exitPush * k;
          if (CONFIG.exitFade) exitFade *= 1 - k;
        }
      }

      if (screenY < -30 || screenY > vh + 30) continue;

      let entryEase = 1;
      if (entry < 1) {
        const delay = ((i * 0.6180339887) % 1) * stagger;
        const e = Math.min(Math.max((entry - delay) / window_, 0), 1);
        if (e <= 0) continue;
        entryEase = easeOut(e);
        const fromX = x < vw / 2 ? -CONFIG.dotsFrom : vw + CONFIG.dotsFrom;
        x = fromX + (x - fromX) * entryEase;
      }

      const t = (ctEff + 1) / 2;
      const nearEff = ctEff > 0;
      const ctx = nearEff ? fx : bx;

      const gain  = (1 + pull * CONFIG.focusGain)
                  * (1 + claimed * (CONFIG.shapeGain - 1));
      const r     = CONFIG.size * (CONFIG.scaleFar + (1 - CONFIG.scaleFar) * t) * gain;
      let alpha   = (CONFIG.alphaFar + (CONFIG.alphaNear - CONFIG.alphaFar) * t) * gain;
      if (nearEff) alpha *= CONFIG.frontDamp;

      ctx.globalAlpha = Math.min(alpha, 1) * entryEase * exitFade;
      ctx.fillStyle = depthColour(t);
      ctx.beginPath();
      ctx.ellipse(x, screenY, r, r * sq, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawWeb();
  drawHelix();

  bx.globalAlpha = 1;
  fx.globalAlpha = 1;
}

function drawHelix() {
  if (!CONFIG.tlDots || CONFIG.tlSpacing < 1) return;

  for (const h of helixes) {
    const count = Math.ceil(h.h / CONFIG.tlSpacing);
    const spin = beatScroll * CONFIG.tlSpin;
    const perDot = (CONFIG.tlSpacing / Math.max(CONFIG.tlTurnPx, 1)) * Math.PI * 2;

    for (let i = 0; i < count; i++) {
      const y = h.y + i * CONFIG.tlSpacing - beatScroll;
      if (y < -20 || y > vh + 20) continue;

      for (let s = 0; s < 2; s++) {
        const a = i * perDot + spin + s * Math.PI;
        const depth = Math.cos(a);
        const t = (depth + 1) / 2;
        const ctx = depth > 0 ? fx : bx;

        ctx.globalAlpha = CONFIG.tlAlpha * (0.3 + 0.7 * t);
        ctx.fillStyle = depthColour(t);
        ctx.beginPath();
        ctx.arc(h.cx + Math.sin(a) * CONFIG.tlRadius, y,
                CONFIG.tlSize * (0.55 + 0.45 * t), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawWeb() {
  const max = CONFIG.webLink;
  if (max <= 0 || webPts.length < 6) return;

  fx.strokeStyle = CONFIG.colorFar;
  fx.lineWidth = 1;

  for (let a = 0; a < webPts.length; a += 3) {
    for (let b = a + 3; b < webPts.length; b += 3) {
      const dx = webPts[a] - webPts[b];
      const dy = webPts[a + 1] - webPts[b + 1];
      const d2 = dx * dx + dy * dy;
      if (d2 > max * max) continue;

      const near = 1 - Math.sqrt(d2) / max;
      fx.globalAlpha = near * CONFIG.webLinkAlpha
                     * Math.min(webPts[a + 2], webPts[b + 2]);
      fx.beginPath();
      fx.moveTo(webPts[a], webPts[a + 1]);
      fx.lineTo(webPts[b], webPts[b + 1]);
      fx.stroke();
    }
  }
}

function moveElements() {
  for (const p of paras) {
    const screenY = p.cy - current;
    p.ty = p.par ? (screenY - vh / 2) * p.par : 0;
    let tf = '';
    if (p.par) tf += `translate3d(0, ${p.ty.toFixed(2)}px, 0)`;
    if (p.zoom) {
      const prog = Math.min(Math.max((vh - (screenY - vh / 2)) / vh, 0), 1);
      tf += ` scale(${(1.06 - 0.06 * prog).toFixed(4)})`;
    }
    p.el.style.transform = tf;
  }
}

function frame(now) {
  lastFrame = now;
  const prev = current;
  current += (target - current) * CONFIG.ease;
  if (Math.abs(target - current) < 0.05) current = target;
  velocity += ((current - prev) - velocity) * 0.2;

  beatScroll += (target - beatScroll) * Math.min(Math.max(CONFIG.beatEase, 0.01), 1);

  if (heroReady && !introStart) introStart = now;
  const t = introStart ? now - introStart : -1e9;

  const dn = CONFIG.nameInDelay,  mn = Math.max(CONFIG.nameInMs, 1);
  const dw = CONFIG.wordsInDelay, mw = Math.max(CONFIG.wordsInMs, 1);
  const dr = CONFIG.ruleInDelay,  mr = Math.max(CONFIG.ruleInMs, 1);
  const span = Math.max(dn + mn, dw + mw, dr + mr);

  const rewound = Math.min(beatScroll / Math.max(vh * CONFIG.heroOutVh, 1), 1) * span;
  const tOut = span - rewound;

  const at = (time, delay, dur) => Math.min(Math.max((time - delay) / dur, 0), 1);

  setHero(
    Math.min(at(t, dn, mn), at(tOut, dn, mn)),
    Math.min(at(t, dw, mw), at(tOut, dw, mw)),
    Math.min(at(t, dr, mr), at(tOut, dr, mr))
  );

  if (scrollCue) {
    scrollCue.style.setProperty('--arrow',
      (1 - clamp01(beatScroll / Math.max(CONFIG.arrowFadePx, 1))).toFixed(3));
  }

  moveElements();
  updateDarkness();
  updateStages();
  moveBeats();
  render();
  requestAnimationFrame(frame);
}

window.addEventListener('scroll', () => {
  target = window.scrollY;
  nav.classList.toggle('is-scrolled', target > 40);
}, { passive: true });

window.addEventListener('pointermove', (e) => {
  pointerX = e.clientX;
  pointerY = e.clientY;
  pointerSeen = true;
  if (cursorEl) {
    cursorEl.style.setProperty('--cx', pointerX + 'px');
    cursorEl.style.setProperty('--cy', pointerY + 'px');
    cursorRing.style.setProperty('--cx', pointerX + 'px');
    cursorRing.style.setProperty('--cy', pointerY + 'px');
  }
}, { passive: true });

window.addEventListener('resize', measure);

target = current = beatScroll = window.scrollY;
measure();

if (reduced) {
  setHero(1, 1, 1);
  if (scrollCue) scrollCue.style.setProperty('--arrow', '1');
  window.addEventListener('scroll', () => {
    current = beatScroll = window.scrollY;
    moveBeats(); render();
  }, { passive: true });
} else {
  setHero(0, 0, 0);
  requestAnimationFrame(frame);
}

const revealables = document.querySelectorAll(
  '[data-split], [data-par], [data-focus], .skillset, .label[data-rule], .fade'
);

if (reduced || !('IntersectionObserver' in window)) {
  revealables.forEach(el => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

  revealables.forEach(el => io.observe(el));
}

function replayIntro() {
  window.scrollTo(0, 0);
  target = current = beatScroll = 0;
  introStart = 0;
}

window.addEventListener('load', measure);
if (document.fonts) {
  document.fonts.ready.then(() => { measure(); heroReady = true; });
} else {
  heroReady = true;
}
