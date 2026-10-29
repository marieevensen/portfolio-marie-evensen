// Telescope: a round lens follows the cursor over a project row and pans
// across that project's preview image as you move.
const lens = document.querySelector('.lens');
const rows = document.querySelectorAll('.projects li[data-preview]');
const SIZE = 220;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let target = { x: 0, y: 0 };
let pos = { x: 0, y: 0 };

rows.forEach(row => {
  row.addEventListener('mouseenter', e => {
    lens.style.backgroundImage = `url(${row.dataset.preview})`;
    target = pos = { x: e.clientX, y: e.clientY };
    lens.classList.add('on');
  });

  row.addEventListener('mousemove', e => {
    target = { x: e.clientX, y: e.clientY };
    const r = row.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    lens.style.backgroundPosition = `${px * 100}% ${py * 100}%`;
  });

  row.addEventListener('mouseleave', () => lens.classList.remove('on'));
});

function tick() {
  // Ease towards the cursor so the lens drifts like a scope being moved
  const ease = reduceMotion ? 1 : 0.18;
  pos = {
    x: pos.x + (target.x - pos.x) * ease,
    y: pos.y + (target.y - pos.y) * ease,
  };
  lens.style.translate = `${pos.x - SIZE / 2}px ${pos.y - SIZE / 2}px`;
  requestAnimationFrame(tick);
}
tick();
