// Projects and their images. Swap these for real work: [src, width, height]
const PROJECTS = [
  { name: 'Nordlys', type: 'App', desc: 'Aurora forecast app', year: 2026, images: [
    ['previews/nordlys-phone.svg', 600, 800], ['previews/nordlys.svg', 1200, 600],
  ] },
  { name: 'Fjord Serif', type: 'Type', desc: 'Typeface', year: 2025, images: [
    ['previews/fjord-o.svg', 600, 800], ['previews/fjord.svg', 1200, 600], ['previews/fjord-g.svg', 700, 700],
  ] },
  { name: 'Salt', type: 'Identity', desc: 'Ceramics identity', year: 2024, images: [
    ['previews/salt-mark.svg', 700, 700], ['previews/salt-vessels.svg', 800, 600], ['previews/salt-arch.svg', 600, 800],
  ] },
  { name: 'Mørketid', type: 'Photography', desc: 'Photo series', year: 2023, images: [
    ['previews/morketid-moon.svg', 600, 800], ['previews/morketid-lights.svg', 800, 600], ['previews/morketid-glow.svg', 700, 700],
  ] },
];

const work = document.getElementById('work');
const indexList = document.getElementById('index-list');
const label = document.getElementById('label');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Build the work column and the index list
const items = [];
PROJECTS.forEach((project, p) => {
  project.images.forEach(([src, w, h], i) => {
    const el = document.createElement('div');
    el.className = `item ${w > h ? 'landscape' : w < h ? 'portrait' : 'square'}`;
    if (i === 0) el.id = `project-${p}`;
    const img = document.createElement('img');
    img.src = src;
    img.alt = `${project.name} — ${project.desc}`;
    img.width = w;
    img.height = h;
    img.loading = 'lazy';
    el.append(img);
    work.append(el);
    items.push({ el, project });
  });

  const li = document.createElement('li');
  li.innerHTML = `<button><strong>${project.name}</strong><span class="soft">${project.desc}</span><span class="soft">${project.year}</span></button>`;
  li.querySelector('button').addEventListener('click', () => {
    setView('work');
    document.getElementById(`project-${p}`).scrollIntoView({ block: 'center' });
  });
  li.addEventListener('mouseenter', () => showLabel(project, true));
  li.addEventListener('mouseleave', hideLabel);
  indexList.append(li);
});

// Items grow slightly as they near the middle of the screen
function onScroll() {
  if (reduceMotion) return;
  const mid = innerHeight / 2;
  for (const { el } of items) {
    const r = el.getBoundingClientRect();
    const d = Math.abs(r.top + r.height / 2 - mid) / innerHeight;
    const t = Math.max(0, 1 - d * 1.4);
    el.style.transform = `scale(${0.94 + t * 0.06})`;
  }
}
addEventListener('scroll', () => requestAnimationFrame(onScroll), { passive: true });
addEventListener('resize', onScroll);
onScroll();

// Cursor label
function showLabel(project, thumb) {
  label.classList.toggle('thumb', thumb);
  label.innerHTML = thumb
    ? `<img src="${project.images[0][0]}" alt="">`
    : `<span>${project.name}</span><span class="soft">${project.type}</span>`;
  label.classList.add('on');
}

function hideLabel() {
  label.classList.remove('on');
}

items.forEach(({ el, project }) => {
  el.addEventListener('mouseenter', () => showLabel(project, false));
  el.addEventListener('mouseleave', hideLabel);
});

addEventListener('mousemove', e => {
  label.style.translate = `${e.clientX + 14}px ${e.clientY + 14}px`;
});

// Work / Index views
function setView(view) {
  document.body.dataset.view = view;
  document.querySelectorAll('.toggle button').forEach(b => {
    b.setAttribute('aria-pressed', b.dataset.viewLink === view);
  });
  about.hidden = true;
  hideLabel();
  scrollTo(0, 0);
  onScroll();
}

document.querySelectorAll('[data-view-link]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    setView(el.dataset.viewLink);
  });
});

// About opens over the page; clicking About again or pressing Esc closes it
const about = document.getElementById('about');
document.querySelector('[data-open="about"]').addEventListener('click', () => { about.hidden = !about.hidden; });
addEventListener('keydown', e => { if (e.key === 'Escape') about.hidden = true; });

// Local time in Norway
const clock = document.getElementById('clock');
function tickClock() {
  clock.textContent = new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit' });
}
tickClock();
setInterval(tickClock, 10000);
