const STRIP = {
  speed: 26,
  resumeMs: 1400,
  friction: 0.94,
  minGlide: 0.02,
};

const slugOf = window.PROJECT_SLUG;
const extra = window.PROJECT_PAGES || {};

const params = new URLSearchParams(location.search);
const wanted = params.get('p') || '';

const els = {
  shot: document.getElementById('pp-shot'),
  tag: document.getElementById('pp-tag'),
  title: document.getElementById('pp-title'),
  body: document.getElementById('pp-body'),
  link: document.getElementById('pp-link'),
  strip: document.getElementById('pp-strip'),
  track: document.getElementById('pp-track'),
};

function readSources(doc) {
  return [...doc.querySelectorAll('#helix-data .hx-src')].map(el => ({
    tag: el.dataset.tag || '',
    title: el.dataset.title || '',
    note: el.textContent.trim(),
    href: el.dataset.href || '',
    link: el.dataset.link || 'Website',
    img: el.dataset.img || '',
    slug: slugOf(el.dataset.title || ''),
  }));
}

function fillMenus(all, current) {
  document.querySelectorAll('.nav__menu[data-group]').forEach(menu => {
    const group = menu.dataset.group;
    menu.textContent = '';
    all.filter(s => s.tag.split('/')[0].trim() === group).forEach(s => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'nav__item';
      a.href = 'project.html?p=' + s.slug;
      a.textContent = s.title;
      if (s.slug === current) a.classList.add('is-active');
      li.appendChild(a);
      menu.appendChild(li);
    });
  });
}

function paint(src) {
  const more = extra[src.slug] || {};

  document.title = src.title + " — Victor's Design Profile";
  els.tag.textContent = src.tag;
  els.title.textContent = src.title;
  els.body.textContent = more.body || src.note;

  if (src.img) {
    els.shot.classList.add('ph--shot');
    els.shot.style.backgroundImage = 'url("' + src.img + '")';
  }

  if (src.href) {
    els.link.textContent = src.link;
    els.link.href = src.href;
    els.link.hidden = false;
  }

  const shots = (more.gallery || []).filter(Boolean);
  buildStrip(shots);
}

function buildStrip(shots) {
  const n = Math.max(shots.length, window.PROJECT_STRIP_MIN || 4);
  const make = (i) => {
    const cell = document.createElement('div');
    cell.className = 'pp__cell';
    const ph = document.createElement('div');
    ph.className = 'ph ph--card';
    if (shots[i]) {
      ph.classList.add('ph--shot');
      ph.style.backgroundImage = 'url("' + shots[i] + '")';
    }
    cell.appendChild(ph);
    return cell;
  };

  const pass = document.createDocumentFragment();
  for (let i = 0; i < n; i++) pass.appendChild(make(i));
  els.track.appendChild(pass);
  els.track.dataset.count = String(n);
  els.track.dataset.shots = JSON.stringify(shots);
  fillTrack();
  startStrip();
}

function fillTrack() {
  const track = els.track;
  const n = Number(track.dataset.count) || 4;
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0;

  while (track.children.length > n) track.removeChild(track.lastElementChild);

  const one = track.scrollWidth + gap;
  if (!one) return 0;

  const need = one + window.innerWidth + (track.firstElementChild
    ? track.firstElementChild.getBoundingClientRect().width : 0);
  const copies = Math.max(2, Math.ceil(need / one));

  const base = [...track.children];
  for (let c = 1; c < copies; c++) {
    for (const cell of base) track.appendChild(cell.cloneNode(true));
  }
  return one;
}

function startStrip() {
  const track = els.track;
  const strip = els.strip;
  let offset = 0;
  let span = 0;
  let dragging = false;
  let pointerId = null;
  let lastX = 0;
  let glide = 0;
  let lastLet = 0;
  let prev = performance.now();

  const measure = () => {
    const n = Number(track.dataset.count) || 4;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    let w = 0;
    for (let i = 0; i < n && track.children[i]; i++) {
      w += track.children[i].getBoundingClientRect().width + gap;
    }
    span = w;
  };
  const relayout = () => { fillTrack(); measure(); };
  measure();
  window.addEventListener('resize', relayout);
  window.addEventListener('load', relayout);

  const wrap = () => {
    if (!span) return;
    while (offset <= -span) offset += span;
    while (offset > 0) offset -= span;
  };

  strip.addEventListener('pointerdown', (e) => {
    dragging = true;
    pointerId = e.pointerId;
    lastX = e.clientX;
    glide = 0;
    strip.setPointerCapture(pointerId);
    strip.classList.add('is-held');
  });

  strip.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    offset += dx;
    glide = dx;
    wrap();
    track.style.transform = 'translate3d(' + offset.toFixed(2) + 'px,0,0)';
  });

  const release = () => {
    if (!dragging) return;
    dragging = false;
    lastLet = performance.now();
    strip.classList.remove('is-held');
    if (pointerId !== null && strip.hasPointerCapture(pointerId)) {
      strip.releasePointerCapture(pointerId);
    }
    pointerId = null;
  };
  strip.addEventListener('pointerup', release);
  strip.addEventListener('pointercancel', release);
  strip.addEventListener('pointerleave', release);

  const frame = (now) => {
    const dt = Math.min((now - prev) / 1000, 0.1);
    prev = now;

    if (!dragging) {
      if (Math.abs(glide) > STRIP.minGlide) {
        offset += glide;
        glide *= STRIP.friction;
      } else if (now - lastLet > STRIP.resumeMs) {
        offset -= STRIP.speed * dt;
      }
      wrap();
      track.style.transform = 'translate3d(' + offset.toFixed(2) + 'px,0,0)';
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function fail(msg) {
  els.title.textContent = 'Project not found';
  els.body.textContent = msg;
  els.strip.hidden = true;
}

fetch('index.html', { cache: 'no-cache' })
  .then(r => r.text())
  .then(html => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const all = readSources(doc);
    fillMenus(all, wanted);
    const src = all.find(s => s.slug === wanted);
    if (!src) {
      fail('No project matches "' + wanted + '".');
      return;
    }
    paint(src);
  })
  .catch(() => fail('Could not load the project list.'));
