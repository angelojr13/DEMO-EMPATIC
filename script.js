const nav = document.querySelector('.nav');
const navToggle = document.getElementById('navToggle');

navToggle.addEventListener('click', () => {
  nav.classList.toggle('menu-open');
});

document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('menu-open');
  });
});

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const countEls = document.querySelectorAll('.num[data-count]');

function animateCount(el) {
  const target = parseInt(el.dataset.count, 10);
  const prefix = el.dataset.prefix || '';
  if (reduceMotion) {
    el.textContent = prefix + target.toLocaleString('es-PE');
    return;
  }
  const duration = 1400;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);
    el.textContent = prefix + value.toLocaleString('es-PE');
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

if (countEls.length) {
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  countEls.forEach((el) => countObserver.observe(el));
}

/* ---------- Scroll reveal ---------- */
const revealSelectors = [
  '.section-head', '.card', '.sol-card', '.mini-sol', '.value-item',
  '.approach-card', '.pillar-item', '.photo-grid .ph', '.visual-panel',
  '.stat-card', '.cta-banner', '.about-copy', '.peru-map-copy',
  '.peru-map-visual', '.ae-teaser-copy', '.ae-teaser-stats', '.value-chips',
  '.mv-mini .item', '.contact-point',
  '.team-card', '.event-item', '.podcast-banner', '.biz-card',
  '.report-facts', '.community-actions', '.contact-form', '.contact-points',
  '.legal-content h2', '.legal-content h3', '.legal-content p',
];
const revealEls = document.querySelectorAll(revealSelectors.join(','));

revealEls.forEach((el) => el.classList.add('reveal'));

document.querySelectorAll('.grid-3, .grid-4, .sol-grid, .solutions-teaser, .values-grid, .approach-grid, .pillars, .stat-grid, .photo-grid, .mv-mini, .team-grid, .event-gallery, .biz-grid, .contact-grid, .contact-points').forEach((grid) => {
  [...grid.children].forEach((child, idx) => {
    if (child.classList.contains('reveal')) {
      child.style.transitionDelay = `${Math.min(idx * 70, 280)}ms`;
    }
  });
});

if (reduceMotion || !revealEls.length) {
  revealEls.forEach((el) => el.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach((el) => revealObserver.observe(el));
}

/* ---------- Mapa de Perú: desglose de actividades por región ---------- */
const PERU_REGION_DATA = {
  'Cajamarca':  { share: '50.88%', activities: { 'Evento': 24, 'Intervención': 17, 'Mentoría': 52, 'Taller': 3, 'Visita': 3 } },
  'Lima':       { share: '21.05%', activities: { 'Evento': 15, 'Intervención': 31, 'Mentoría': 38, 'Taller': 8, 'Visita': 8 } },
  'Junín':      { share: '15.79%', activities: { 'Evento': 33, 'Intervención': 22, 'Mentoría': 33, 'Visita': 11 } },
  'Lambayeque': { share: '5.26%',  activities: { 'Evento': 33, 'Intervención': 67 } },
  'Arequipa':   { share: '3.51%',  activities: { 'Evento': 50, 'Intervención': 50 } },
  'Ica':        { share: '1.75%',  activities: { 'Intervención': 100 } },
};
const PERU_ACTIVITY_CLASS = { 'Evento': 'evento', 'Intervención': 'intervencion', 'Mentoría': 'mentoria', 'Taller': 'taller', 'Visita': 'visita' };

const peruDetail = document.getElementById('peruDetail');

function renderPeruDetail(region) {
  const data = PERU_REGION_DATA[region];
  if (!peruDetail || !data) return;
  const entries = Object.entries(data.activities);
  const bar = entries.map(([name, pct]) =>
    `<span class="peru-detail-seg peru-detail-seg--${PERU_ACTIVITY_CLASS[name]}" style="flex-grow:${pct}" title="${name} ${pct}%"></span>`
  ).join('');
  const legend = entries.map(([name, pct]) =>
    `<li><span class="peru-detail-dot peru-detail-dot--${PERU_ACTIVITY_CLASS[name]}"></span>${name} <b>${pct}%</b></li>`
  ).join('');
  peruDetail.classList.add('has-content');
  peruDetail.innerHTML =
    `<div class="peru-detail-inner">` +
    `<div class="peru-detail-head"><span class="peru-detail-region">${region}</span><span class="peru-detail-share">${data.share} de la participación</span></div>` +
    `<div class="peru-detail-bar">${bar}</div>` +
    `<ul class="peru-detail-legend">${legend}</ul>` +
    `</div>`;
  requestAnimationFrame(() => {
    const inner = peruDetail.querySelector('.peru-detail-inner');
    if (inner) inner.classList.add('is-visible');
  });
}

function clearPeruDetail() {
  if (!peruDetail) return;
  peruDetail.classList.remove('has-content');
  peruDetail.innerHTML = '';
}

/* Debounced hover controller: hovering near the border between two
   regions fires rapid mouseenter/mouseleave pairs on the SVG paths.
   We delay the "clear" and skip re-renders for the region already
   showing, so that flicker doesn't thrash the detail panel. */
let peruActiveRegion = null;
let peruClearTimer = null;

function peruCancelClear() {
  if (peruClearTimer) {
    clearTimeout(peruClearTimer);
    peruClearTimer = null;
  }
}

function peruScheduleClear() {
  peruCancelClear();
  peruClearTimer = setTimeout(() => {
    clearPeruDetail();
    peruActiveRegion = null;
    peruClearTimer = null;
  }, 120);
}

document.querySelectorAll('.peru-map-visual path[data-region]').forEach((path) => {
  const region = path.dataset.region;
  const hasData = Boolean(PERU_REGION_DATA[region]);
  path.addEventListener('mouseenter', () => {
    peruCancelClear();
    if (hasData) {
      path.classList.add('peru-region-hover');
      if (peruActiveRegion !== region) {
        renderPeruDetail(region);
        peruActiveRegion = region;
      }
    } else {
      peruScheduleClear();
    }
  });
  path.addEventListener('mouseleave', () => {
    path.classList.remove('peru-region-hover');
    peruScheduleClear();
  });
});

if (!reduceMotion) {
  document.querySelectorAll('a[href$=".html"]').forEach((link) => {
    if (link.target === '_blank') return;
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === window.location.pathname.split('/').pop()) return;
      e.preventDefault();
      document.body.classList.add('is-leaving');
      setTimeout(() => {
        window.location.href = href;
      }, 320);
    });
  });
}

/* ---------- Floating WhatsApp CTA ---------- */
(function () {
  var wa = document.createElement('a');
  wa.className = 'wa-float';
  wa.href = 'https://wa.me/51974131951';
  wa.target = '_blank';
  wa.rel = 'noopener';
  wa.setAttribute('aria-label', 'Habla con un Consultor Senior por WhatsApp');
  wa.innerHTML =
    '<span class="wa-float-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2Zm5.4 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1-1.3-1-2.5s.6-1.8.9-2.1c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.4.2.5.7 1.7.8 1.8.1.1.1.3 0 .5-.1.2-.1.3-.3.4-.1.2-.3.3-.4.5-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.5 1.5.3.1.5.1.7-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1l1.6.8c.2.1.4.2.4.3.1.2.1.7-.1 1.2Z"/></svg></span>' +
    '<span class="wa-float-text">Habla con un Consultor Senior</span>';
  document.body.appendChild(wa);
})();

/* ---------- Cookie consent banner ---------- */
(function () {
  var STORAGE_KEY = 'empatic-cookie-consent';
  if (localStorage.getItem(STORAGE_KEY)) return;

  var banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Aviso de cookies');
  banner.innerHTML =
    '<p>Usamos cookies técnicas esenciales para el funcionamiento del sitio. No usamos cookies de seguimiento ni publicidad sin tu consentimiento. <a href="privacidad.html#cookies">Más información</a></p>' +
    '<div class="cookie-actions">' +
    '<button type="button" class="cookie-reject">Rechazar</button>' +
    '<button type="button" class="cookie-accept">Aceptar</button>' +
    '</div>';

  document.body.appendChild(banner);

  function dismiss(value) {
    localStorage.setItem(STORAGE_KEY, value);
    banner.remove();
  }

  banner.querySelector('.cookie-accept').addEventListener('click', function () { dismiss('accepted'); });
  banner.querySelector('.cookie-reject').addEventListener('click', function () { dismiss('rejected'); });
})();
