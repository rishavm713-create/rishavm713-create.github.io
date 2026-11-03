// Content lives here so the page can be updated without touching the layout.
// Groups match the Framer portfolio sections.
const GROUPS = {
  shorts: [
    ['L9VukD3t2_k', 'Can India get its next Nobel Prize winner?', 'ISI, CMI & Olympiads'],
    ['EtwjvfFXU0c', 'Why only 1 IISc and so many IITs?', 'SciAstra'],
    ['HQtSFue50wU', 'Better than IISc? IACS Kolkata', 'SciAstra'],
    ['20_LFWckM5A', 'What if AI takes over tomorrow', 'SciAstra'],
    ['s1twi-V0bGE', 'SLMG', 'Client project'],
    ['158XSrdGjso', 'Ad film', 'Client project'],
  ],
  avatar: [
    ['v1rqeGhWyyM', 'Three-star solar system found by Indian astronomers', 'SciAstra'],
    ['oYvxf2p6Fd0', 'ISRO docks two satellites in space', 'SciAstra'],
    ['1BvXCjMxlQo', 'The era of AI warfare', 'Science First'],
    ['DTNar-we1fg', 'NASA Moon mission breaks a 50-year record', 'Science First'],
    ['dGxjdPfv-LE', 'Ice on Mars', 'Science First'],
    ['QR5kQXgSx3I', 'Save Aravali', 'Science First'],
  ],
  full: [
    ['S7wqHcPztcw', "Who is killing India's top scientists?", 'SciAstra'],
    ['-VzIzpqPljg', 'How to become an astrophysicist in India', 'SciAstra'],
    ['CmdVgHVcTcE', 'MyAstra', 'Client project'],
    ['4h-ds13RwaQ', 'Elon Musk', 'Edit sample'],
  ],
  podcast: [
    ['X6stBIjZpW4', 'How to become an ISRO scientist? IIT Bombay professor', 'SciAstra'],
  ],
};
// [screenshot, views, what]
const PROOF = [
  ['p1', 6562480, 'Long video'],
  ['p4', 5314630, 'Short'],
  ['p12', 3540000, 'Channel views in October', '35.4 lakh'],
  ['p2', 3111993, 'Long video'],
  ['p5', 2374366, 'Short'],
  ['p14', 2195298, 'Long video'],
  ['p3', 1734316, 'Long video'],
  ['p6', 1257536, 'Short'],
  ['p16', 360000, 'Short, first week', '3.6 lakh'],
  ['p15', 284852, 'Long video'],
];
// daily views shape read off the 6 Oct – 2 Nov 2026 screenshot (thousands)
const DAILY = [3, 9, 7, 5, 6, 4, 5, 6, 7, 7, 7, 7, 8, 7, 10, 23, 18, 36, 16, 7, 11, 12, 33, 60, 57, 70, 93, 63];
const LOGOS = [3, 1, 4, 10, 8, 2, 15, 11, 9, 12, 5, 13, 6, 14, 7];

const $ = (s) => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const PLAY = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="rgba(10,10,12,.55)" stroke="#fff" stroke-opacity=".55"/><path d="M26 21l18 11-18 11z" fill="#fff"/></svg>';

// marquees: list twice for a seamless loop
const twice = (h) => h + h;
$('#logos').innerHTML = twice(LOGOS.map((n) => `<img src="img/creators/c${n}.webp" width="72" height="72" alt="" loading="lazy">`).join(''));
const thumb = (n) => `<img src="img/thumbs/t${n}.webp" width="640" height="360" alt="Thumbnail design ${n}" loading="lazy">`;
$('#film1').innerHTML = twice([1, 2, 3, 4, 5].map(thumb).join(''));
$('#film2').innerHTML = twice([6, 7, 8, 9].map(thumb).join(''));

// hero waveform
$('.bars').innerHTML = Array.from({ length: 64 }, (_, i) =>
  `<span style="--h:${20 + Math.round(70 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * .37)))}%;--d:${(i % 8) * .09}s"></span>`).join('');

// hero timecode runs at 25 fps
const tc = $('#tc');
if (!reduce) {
  const t0 = performance.now();
  const pad = (n) => String(n).padStart(2, '0');
  (function tick(now) {
    const f = Math.floor((now - t0) / 40);
    tc.textContent = `00:${pad(Math.floor(f / 1500) % 60)}:${pad(Math.floor(f / 25) % 60)}:${pad(f % 25)}`;
    requestAnimationFrame(tick);
  })(t0);
}

// videos
for (const [g, list] of Object.entries(GROUPS)) {
  const vert = g === 'shorts' || g === 'avatar';
  $('#g-' + g).innerHTML = list.map(([id, t, ch]) =>
    `<button class="vid" data-id="${id}" data-v="${vert ? 1 : ''}" aria-label="Play: ${t}"><img src="https://i.ytimg.com/vi/${id}/${vert ? 'oar2' : 'hqdefault'}.jpg" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${id}/hqdefault.jpg'" width="480" height="${vert ? 854 : 360}" loading="lazy" alt=""><span class="play">${PLAY}</span><span class="cap">${t}<small>${ch}</small></span></button>`
  ).join('');
}

// result cards
const fmt = (n) => n.toLocaleString('en-IN');
$('#metrics').innerHTML = PROOF.map(([f, v, w, label], i) =>
  `<div class="metric rv" style="--i:${i % 3}"><span class="kind">${w}</span><b data-count="${v}"${label ? ` data-label="${label}"` : ''}>${label || fmt(v)}</b><span class="unit">views</span><span class="meter"><i style="--p:${Math.max(8, Math.round(100 * Math.log10(v / 1e5 + 1) / Math.log10(66.6)))}%"></i></span><button class="link" data-proof="${f}">Proof</button></div>`
).join('');

// chart path
(function drawChart() {
  const W = 600, H = 260, max = 75;
  const pts = DAILY.map((v, i) => [i * W / (DAILY.length - 1), H - (v / max) * (H - 20)]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  $('#line').setAttribute('d', d);
  $('#area').setAttribute('d', `${d} L${W},${H} L0,${H} Z`);
  const [ex, ey] = pts[pts.length - 1];
  $('#end').setAttribute('cx', ex); $('#end').setAttribute('cy', ey);
  const len = $('#line').getTotalLength();
  $('#line').style.setProperty('--len', len);
})();

// counters
function countUp(el) {
  const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
  const pre = el.dataset.prefix || '', suf = el.dataset.suffix || '', label = el.dataset.label;
  if (reduce) return;
  const t0 = performance.now(), dur = 1400;
  (function step(now) {
    const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
    const v = to * e;
    el.textContent = p < 1 ? pre + (dec ? v.toFixed(dec) : fmt(Math.round(v))) + suf : (label || pre + (dec ? to.toFixed(dec) : fmt(to)) + suf);
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}

// dialog: video or proof screenshot, loaded only on tap
const dlg = $('#player');
const frame = dlg.querySelector('.frame');
function open(html, mode) {
  dlg.className = mode;
  frame.innerHTML = html;
  dlg.showModal();
}
document.addEventListener('click', (e) => {
  const v = e.target.closest('.vid');
  if (v) return open(`<iframe src="https://www.youtube-nocookie.com/embed/${v.dataset.id}?autoplay=1&rel=0&playsinline=1" title="YouTube video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`, v.dataset.v ? 'v' : '');
  const p = e.target.closest('[data-proof]');
  if (p) return open(`<img src="img/proof/${p.dataset.proof}.webp" alt="YouTube Studio screenshot">`, 'pic');
});
const closeDlg = () => { frame.innerHTML = ''; dlg.close(); };
dlg.querySelector('.close').addEventListener('click', closeDlg);
dlg.addEventListener('click', (e) => { if (e.target === dlg) closeDlg(); });
dlg.addEventListener('cancel', () => { frame.innerHTML = ''; });

document.querySelectorAll('.pipe li').forEach((li, k) => li.style.setProperty('--k', k));

// reveal + counters + chart on scroll
document.querySelectorAll('.section > h2, .pipe, .xp, .case, .cs, .caps, .cards, .plans, .group').forEach((el) => el.classList.add('rv'));
const io = new IntersectionObserver((es) => es.forEach((en) => {
  if (!en.isIntersecting) return;
  const t = en.target;
  t.classList.add('in');
  if (t.dataset.count) countUp(t);
  io.unobserve(t);
}), { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('.rv, [data-count], #chart').forEach((el) => io.observe(el));
