// Projects and their images. Swap these for real work: [src, width, height]
const PROJECTS = [
  { name: 'Nordlys', desc: 'Aurora forecast app', year: 2026, images: [
    ['previews/nordlys.svg', 1200, 600], ['previews/nordlys-phone.svg', 600, 800], ['previews/nordlys-sky.svg', 700, 700],
  ] },
  { name: 'Fjord Serif', desc: 'Typeface', year: 2025, images: [
    ['previews/fjord.svg', 1200, 600], ['previews/fjord-o.svg', 600, 800], ['previews/fjord-g.svg', 700, 700],
  ] },
  { name: 'Salt', desc: 'Ceramics identity', year: 2024, images: [
    ['previews/salt-arch.svg', 600, 800], ['previews/salt-mark.svg', 700, 700], ['previews/salt-vessels.svg', 800, 600],
  ] },
  { name: 'Mørketid', desc: 'Photo series', year: 2023, images: [
    ['previews/morketid-moon.svg', 600, 800], ['previews/morketid-lights.svg', 800, 600], ['previews/morketid-glow.svg', 700, 700],
  ] },
];

const IMAGES = PROJECTS.flatMap(p => p.images.map(([src, w, h]) => ({ src, w, h, project: p })));

const CELL = 220;
const field = document.getElementById('field');
const caption = document.getElementById('caption');
const defaultCaption = caption.innerHTML;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let tiles = [];
let cols = 0;
let rows = 0;
let offset = { x: 0, y: 0 };
let velocity = { x: 0, y: 0 };
let pointer = { x: innerWidth / 2, y: innerHeight / 2 };
let focus = { ...pointer };
let activity = 0;
let opened = 0;
let dragging = false;
let hovered = null;

// Stable pseudo-random number for a grid cell, so each cell always shows the same image
function hash(x, y, seed) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 982451653);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

const mod = (n, m) => ((n % m) + m) % m;
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

function build() {
  field.innerHTML = '';
  cols = Math.ceil(innerWidth / CELL) + 2;
  rows = Math.ceil(innerHeight / CELL) + 2;
  tiles = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const el = document.createElement('div');
      el.className = 'tile';
      const img = document.createElement('img');
      img.alt = '';
      img.draggable = false;
      el.append(img);
      field.append(el);
      tiles.push({ el, img, c, r, key: null });
    }
  }
}

// Decide what a world cell contains: nothing, or an image with a size and position inside the cell
function fill(tile, cx, cy) {
  tile.key = `${cx},${cy}`;
  if (hash(cx, cy, 1) < 0.25) {
    tile.image = null;
    tile.el.style.display = 'none';
    return;
  }
  const image = IMAGES[Math.floor(hash(cx, cy, 2) * IMAGES.length)];
  const base = image.w > image.h ? 190 : image.w < image.h ? 120 : 150;
  const w = Math.min(base * (0.7 + hash(cx, cy, 3) * 0.6), CELL - 20);
  const h = w * image.h / image.w;
  tile.image = image;
  tile.w = w;
  tile.h = h;
  tile.jx = hash(cx, cy, 4) * (CELL - w);
  tile.jy = hash(cx, cy, 5) * Math.max(0, CELL - h);
  tile.img.src = image.src;
  tile.el.style.width = `${w}px`;
  tile.el.style.height = `${h}px`;
  tile.el.style.display = '';
}

function frame() {
  if (!dragging) {
    offset.x += velocity.x;
    offset.y += velocity.y;
    velocity.x *= 0.92;
    velocity.y *= 0.92;
  }

  // The focus follows the pointer; moving opens the field up wider
  const ease = reduceMotion ? 1 : 0.1;
  const speed = Math.hypot(pointer.x - focus.x, pointer.y - focus.y);
  focus.x += (pointer.x - focus.x) * ease;
  focus.y += (pointer.y - focus.y) * ease;
  activity = clamp(activity * 0.97 + speed * 0.004 + Math.hypot(velocity.x, velocity.y) * 0.01, 0, 1);
  opened += ((document.body.classList.contains('entered') ? 1 : 0) - opened) * 0.04;

  const short = Math.min(innerWidth, innerHeight);
  const radius = reduceMotion ? short * 0.8 : short * (0.6 + activity * 0.6) * opened;

  const spanX = cols * CELL;
  const spanY = rows * CELL;
  let over = null;

  for (const tile of tiles) {
    const sx = mod(tile.c * CELL + offset.x + CELL, spanX) - CELL;
    const sy = mod(tile.r * CELL + offset.y + CELL, spanY) - CELL;
    const cx = Math.round((sx - offset.x) / CELL);
    const cy = Math.round((sy - offset.y) / CELL);
    if (tile.key !== `${cx},${cy}`) fill(tile, cx, cy);
    if (!tile.image) continue;

    const x = sx + tile.jx;
    const y = sy + tile.jy;
    const d = Math.hypot(x + tile.w / 2 - focus.x, y + tile.h / 2 - focus.y);
    const t = radius ? clamp(1 - (d - radius * 0.5) / (radius * 0.7), 0, 1) : 0;

    tile.el.style.opacity = t;
    tile.el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${0.92 + t * 0.08})`;

    if (t > 0.6 && pointer.x >= x && pointer.x <= x + tile.w && pointer.y >= y && pointer.y <= y + tile.h) {
      over = tile.image.project;
    }
  }

  if (over !== hovered && !dragging) {
    hovered = over;
    caption.innerHTML = over ? `${over.name} — ${over.desc}, ${over.year}` : defaultCaption;
  }

  requestAnimationFrame(frame);
}

// Drag, swipe and scroll to pan
let last = null;
field.addEventListener('pointerdown', e => {
  dragging = true;
  last = { x: e.clientX, y: e.clientY };
  field.setPointerCapture(e.pointerId);
  field.classList.add('dragging');
});

addEventListener('pointermove', e => {
  pointer = { x: e.clientX, y: e.clientY };
  if (!dragging) return;
  velocity = { x: e.clientX - last.x, y: e.clientY - last.y };
  offset.x += velocity.x;
  offset.y += velocity.y;
  last = { x: e.clientX, y: e.clientY };
});

addEventListener('pointerup', () => {
  dragging = false;
  field.classList.remove('dragging');
});

addEventListener('wheel', e => {
  if (!document.body.classList.contains('entered')) return enter();
  offset.x -= e.deltaX;
  offset.y -= e.deltaY;
}, { passive: true });

addEventListener('resize', build);

// Intro
const intro = document.getElementById('intro');
function enter() {
  intro.classList.add('gone');
  document.body.classList.add('entered');
}
intro.addEventListener('click', enter);
setTimeout(enter, 4000);

// About panel
const about = document.getElementById('about');
document.querySelector('[data-open="about"]').addEventListener('click', () => { about.hidden = false; });
about.querySelector('[data-close]').addEventListener('click', () => { about.hidden = true; });
addEventListener('keydown', e => { if (e.key === 'Escape') about.hidden = true; });

// Local time in Norway
const clock = document.getElementById('clock');
function tickClock() {
  clock.textContent = new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit' });
}
tickClock();
setInterval(tickClock, 10000);

build();
frame();
