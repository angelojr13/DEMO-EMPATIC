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
  '.event-item', '.podcast-banner', '.biz-card',
  '.report-facts', '.community-actions', '.contact-form', '.contact-points',
  '.legal-content h2', '.legal-content h3', '.legal-content p',
  '.vm-card', '.director-grid', '.team-carousel-wrap',
];
const revealEls = document.querySelectorAll(revealSelectors.join(','));

revealEls.forEach((el) => el.classList.add('reveal'));

document.querySelectorAll('.grid-2, .grid-3, .grid-4, .sol-grid, .solutions-teaser, .values-grid, .approach-grid, .pillars, .stat-grid, .photo-grid, .mv-mini, .vm-grid, .team-grid, .event-gallery, .biz-grid, .contact-grid, .contact-points').forEach((grid) => {
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
  wa.setAttribute('aria-label', 'Habla con un consultor por WhatsApp');
  wa.innerHTML =
    '<span class="wa-float-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2Zm5.4 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1-1.3-1-2.5s.6-1.8.9-2.1c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.4.2.5.7 1.7.8 1.8.1.1.1.3 0 .5-.1.2-.1.3-.3.4-.1.2-.3.3-.4.5-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.5 1.5.3.1.5.1.7-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1l1.6.8c.2.1.4.2.4.3.1.2.1.7-.1 1.2Z"/></svg></span>' +
    '<span class="wa-float-text">Habla con un consultor</span>';
  document.body.appendChild(wa);
})();

/* ---------- Floating social icons ---------- */
(function () {
  var wrap = document.createElement('div');
  wrap.className = 'social-float';
  wrap.innerHTML =
    '<a href="https://www.instagram.com/grupoempatic/" aria-label="Instagram" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/></svg></a>' +
    '<a href="https://www.linkedin.com/company/empatic-sostenibilidad/" aria-label="LinkedIn" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7.5 10.5v6M7.5 7.5v.01M11.5 16.5v-4c0-1.5 1-2.4 2.3-2.4 1.3 0 2.2.9 2.2 2.4v4"/></svg></a>';
  document.body.appendChild(wrap);

  var DARK_BG_SELECTOR = '.section-dark, .page-header, .hero, .case-hero, .ae-hero-band, .academy-access-bar, .course-hero-form, .site-footer';
  var ticking = false;

  function updateSocialFloatTheme() {
    ticking = false;
    var rect = wrap.getBoundingClientRect();
    var x = Math.max(0, rect.left - 16);
    var y = rect.top + rect.height / 2;
    var el = document.elementFromPoint(x, y);
    var isDark = !!(el && el.closest(DARK_BG_SELECTOR));
    wrap.classList.toggle('is-on-dark', isDark);
  }

  function requestSocialFloatUpdate() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateSocialFloatTheme);
    }
  }

  window.addEventListener('scroll', requestSocialFloatUpdate, { passive: true });
  window.addEventListener('resize', requestSocialFloatUpdate);
  updateSocialFloatTheme();
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

/* ---------- Acciones Empáticas: slider automático del hero ---------- */
function initAeHeroSlider() {
  var slides = document.querySelectorAll('#aeSlides .ae-slide');
  var dotsWrap = document.getElementById('aeSlideDots');
  var prevBtn = document.getElementById('aeSlidePrev');
  var nextBtn = document.getElementById('aeSlideNext');
  var heroBottom = document.getElementById('aeHeroBottom');
  var heroBand = document.querySelector('.ae-hero-band');
  if (!slides.length || !dotsWrap) return;

  dotsWrap.innerHTML = Array.prototype.map.call(slides, function (_, i) {
    return '<button type="button" class="ae-slide-dot' + (i === 0 ? ' is-active' : '') + '" aria-label="Diapositiva ' + (i + 1) + '"></button>';
  }).join('');
  slides.forEach(function (s, i) { s.classList.toggle('is-active', i === 0); });
  var dots = dotsWrap.querySelectorAll('.ae-slide-dot');

  var current = 0;
  var timer = null;

  function applySlideBg(slide) {
    if (!heroBand) return;
    var bg = slide.getAttribute('data-bg');
    if (bg) empaticSetBackgroundImage(heroBand, bg, '--ae-hero-bg');
    else heroBand.style.removeProperty('--ae-hero-bg');
  }

  function goTo(index) {
    slides[current].classList.remove('is-active');
    dots[current].classList.remove('is-active');
    current = index;
    slides[current].classList.add('is-active');
    dots[current].classList.add('is-active');
    applySlideBg(slides[current]);
    // La banda de estadísticas solo acompaña a la diapositiva sin fondo
    // propio (la de "impacto en territorio"), que comparte su foto.
    if (heroBottom) heroBottom.classList.toggle('is-hidden', !!slides[current].getAttribute('data-bg'));
  }

  applySlideBg(slides[current]);
  if (heroBottom) heroBottom.classList.toggle('is-hidden', !!slides[current].getAttribute('data-bg'));

  function next() {
    goTo((current + 1) % slides.length);
  }

  function prev() {
    goTo((current - 1 + slides.length) % slides.length);
  }

  function startAutoplay() {
    if (reduceMotion) return;
    timer = setInterval(next, 7000);
  }

  function resetAutoplay() {
    clearInterval(timer);
    startAutoplay();
  }

  dots.forEach(function (dot, index) {
    dot.addEventListener('click', function () {
      if (index === current) return;
      goTo(index);
      resetAutoplay();
    });
  });

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      next();
      resetAutoplay();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      prev();
      resetAutoplay();
    });
  }

  startAutoplay();
}

/* ---------- Negocios Sostenibles: banner flotante + modal de postulación ---------- */
(function () {
  var floatBar = document.getElementById('negociosCtaFloat');
  var closeFloatBtn = document.getElementById('negociosCtaClose');
  var openModalBtn = document.getElementById('negociosCtaOpenModal');
  var overlay = document.getElementById('postulacionModalOverlay');
  var closeModalBtn = document.getElementById('postulacionModalClose');
  if (!floatBar || !overlay) return;

  var dismissed = false;

  function checkScroll() {
    if (dismissed) return;
    floatBar.classList.toggle('is-visible', window.scrollY > 400);
  }

  window.addEventListener('scroll', checkScroll, { passive: true });
  checkScroll();

  closeFloatBtn.addEventListener('click', function () {
    dismissed = true;
    floatBar.classList.remove('is-visible');
  });

  function openModal() {
    overlay.classList.add('is-open');
  }

  function closeModal() {
    overlay.classList.remove('is-open');
  }

  openModalBtn.addEventListener('click', openModal);
  closeModalBtn.addEventListener('click', closeModal);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal();
  });
})();

/* ---------- Equipo consultor: datos dinamicos desde Google Sheets ---------- */
var EMPATIC_API = 'https://script.google.com/macros/s/AKfycbwadP6bNL6QE1vpOETkxhTkNLGaVY5DZ8CzfUrgIIYPOZRfFLVRfxUovrU1HM_svD0/exec';
var TEAM_PAGE_SIZE = 5;

function empaticImageUrl(link) {
  if (!link) return '';
  var driveMatch = String(link).match(/\/d\/([a-zA-Z0-9_-]{10,})/) || String(link).match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (driveMatch) {
    return 'https://lh3.googleusercontent.com/d/' + driveMatch[1] + '=w600';
  }
  return link;
}

function empaticSetBackgroundImage(el, url, cssVarName) {
  if (!el || !url) return;
  var img = new Image();
  img.referrerPolicy = 'no-referrer';
  img.onload = function () {
    var value = 'url("' + url + '")';
    if (cssVarName) el.style.setProperty(cssVarName, value);
    else el.style.backgroundImage = value;
  };
  img.src = url;
}

function empaticApplyBgUrls(container) {
  if (!container) return;
  container.querySelectorAll('[data-bg-url]').forEach(function (el) {
    empaticSetBackgroundImage(el, el.getAttribute('data-bg-url'));
    el.removeAttribute('data-bg-url');
  });
}

function empaticEscapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

var LINKEDIN_ICON_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002ZM7 8.48H3V21h4V8.48Zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-3.96 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.68-2.91V8.48Z"/></svg>';
var SPOTIFY_ICON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 10c4-1.5 8-1.5 12 0M6.5 13.3c3.5-1.1 7-1.1 11 0M7 16.5c2.8-.8 5.5-.8 8 0"/></svg>';
var YOUTUBE_ICON_SVG = '<svg viewBox="0 0 24 24"><rect x="3" y="5.5" width="18" height="13" rx="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10.3 9.3v5.4l4.7-2.7-4.7-2.7Z" fill="currentColor"/></svg>';

function empaticTeamCardHtml(c) {
  var bio = empaticEscapeHtml(c.bio);
  var nombre = empaticEscapeHtml(c.nombre);
  var cargo = empaticEscapeHtml(c.cargo);
  var foto = empaticImageUrl(c.foto);
  var linkedin = c.linkedin || '#';
  return (
    '<div class="team-card team-card--example" tabindex="0" data-bio="' + bio + '">' +
      '<div class="team-photo team-photo--img" aria-hidden="true">' +
        '<img src="' + foto + '" alt="" loading="lazy" referrerpolicy="no-referrer">' +
      '</div>' +
      '<h4>' + nombre + '</h4>' +
      '<p class="team-role">' + cargo + '</p>' +
      '<a class="team-linkedin" href="' + linkedin + '" target="_blank" rel="noopener" aria-label="LinkedIn de ' + nombre + '">' +
        LINKEDIN_ICON_SVG +
      '</a>' +
    '</div>'
  );
}

function initTeamCarousel(track, nextBtn, prevBtn) {
  var pages = track.querySelectorAll('.team-page').length;
  var current = 0;
  if (!pages) return;

  function update() {
    track.style.transform = 'translateX(-' + (current * (100 / pages)) + '%)';
    prevBtn.hidden = current === 0;
    nextBtn.hidden = current === pages - 1;
  }

  nextBtn.addEventListener('click', function () {
    if (current < pages - 1) {
      current++;
      update();
    }
  });

  prevBtn.addEventListener('click', function () {
    if (current > 0) {
      current--;
      update();
    }
  });

  update();
}

function initTeamBioBubbles(cards) {
  if (!cards.length) return;

  var bubble = document.createElement('div');
  bubble.className = 'team-bio-bubble';
  bubble.setAttribute('role', 'tooltip');
  bubble.innerHTML = '<div class="team-bio-bubble-arrow"></div><p></p>';
  document.body.appendChild(bubble);
  var bubbleText = bubble.querySelector('p');

  function showBubble(card) {
    var rect = card.getBoundingClientRect();
    bubbleText.textContent = card.dataset.bio;
    var above = rect.top > 160;
    bubble.classList.toggle('is-above', above);
    bubble.style.left = (rect.left + rect.width / 2) + 'px';
    if (above) {
      bubble.style.bottom = (window.innerHeight - rect.top + 12) + 'px';
      bubble.style.top = 'auto';
    } else {
      bubble.style.top = (rect.bottom + 12) + 'px';
      bubble.style.bottom = 'auto';
    }
    requestAnimationFrame(function () { bubble.classList.add('is-visible'); });
  }

  function hideBubble() {
    bubble.classList.remove('is-visible');
  }

  cards.forEach(function (card) {
    card.addEventListener('mouseenter', function () { showBubble(card); });
    card.addEventListener('mouseleave', hideBubble);
    card.addEventListener('focus', function () { showBubble(card); });
    card.addEventListener('blur', hideBubble);
  });

  window.addEventListener('scroll', hideBubble, { passive: true });
}

(function () {
  var nextBtn = document.getElementById('teamNextBtn');
  var prevBtn = document.getElementById('teamPrevBtn');
  var track = document.getElementById('teamTrack');
  if (!nextBtn || !prevBtn || !track) return;

  fetch(EMPATIC_API + '?tipo=consultores')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var activos = data
        .filter(function (c) { return String(c.activo || '').toUpperCase() === 'SI'; })
        .sort(function (a, b) { return (Number(a.orden) || 0) - (Number(b.orden) || 0); });

      var pagesHtml = '';
      for (var i = 0; i < activos.length; i += TEAM_PAGE_SIZE) {
        var pageItems = activos.slice(i, i + TEAM_PAGE_SIZE);
        pagesHtml += '<div class="team-grid team-page">' + pageItems.map(empaticTeamCardHtml).join('') + '</div>';
      }
      track.innerHTML = pagesHtml;

      initTeamCarousel(track, nextBtn, prevBtn);
      initTeamBioBubbles(Array.prototype.slice.call(track.querySelectorAll('.team-card--example[data-bio]')));
    })
    .catch(function (err) {
      console.error('No se pudo cargar el equipo consultor:', err);
    })
    .finally(function () {
      empaticHideLoadingOverlay();
    });
})();

/* ---------- Novedades: Podcast, Articulos y Actividades desde Google Sheets ---------- */
var PODCAST_PAGE_SIZE = 3;
var PODCAST_AUTOPLAY_MS = 8000;
var ARTICULOS_PAGE_SIZE = 3;
var ACTIVIDADES_PAGE_SIZE = 3;
var ACTIVIDADES_AUTOPLAY_MS = 8000;
var CURSOS_PAGE_SIZE = 3;

function empaticSlugify(str) {
  return String(str || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function empaticItemSlug(parts) {
  return empaticSlugify(parts.filter(Boolean).join('-'));
}

function empaticGetSlugParam() {
  return new URLSearchParams(window.location.search).get('slug') || '';
}

function empaticFetchTipo(tipo) {
  return fetch(EMPATIC_API + '?tipo=' + tipo)
    .then(function (res) { return res.json(); })
    .then(function (data) {
      return data.sort(function (a, b) { return (Number(a.orden) || 0) - (Number(b.orden) || 0); });
    });
}

function initNovedadesCarousel(track, nextBtn, prevBtn, options) {
  options = options || {};
  var circular = !!options.circular;
  var pages = track.querySelectorAll('.novedades-page').length;
  var current = 0;
  if (pages < 2) {
    nextBtn.hidden = true;
    prevBtn.hidden = true;
    return { stop: function () {} };
  }

  if (circular) {
    nextBtn.hidden = false;
    prevBtn.hidden = false;
  }

  function update() {
    track.style.transform = 'translateX(-' + (current * 100) + '%)';
    if (!circular) {
      prevBtn.hidden = current === 0;
      nextBtn.hidden = current === pages - 1;
    }
  }

  function goNext() {
    if (circular) {
      current = (current + 1) % pages;
    } else if (current < pages - 1) {
      current++;
    }
    update();
  }

  function goPrev() {
    if (circular) {
      current = (current - 1 + pages) % pages;
    } else if (current > 0) {
      current--;
    }
    update();
  }

  var autoplayTimer = null;
  function resetAutoplay() {
    if (!options.autoplayMs) return;
    if (autoplayTimer) clearInterval(autoplayTimer);
    autoplayTimer = setInterval(goNext, options.autoplayMs);
  }
  function stop() {
    if (autoplayTimer) clearInterval(autoplayTimer);
    autoplayTimer = null;
  }

  nextBtn.addEventListener('click', function () { goNext(); resetAutoplay(); });
  prevBtn.addEventListener('click', function () { goPrev(); resetAutoplay(); });

  update();
  resetAutoplay();
  return { stop: stop };
}

function empaticBuildCircularPages(rows, pageSize) {
  if (rows.length <= pageSize) return [rows];
  var pages = [];
  var start = 0;
  do {
    var page = [];
    for (var k = 0; k < pageSize; k++) {
      page.push(rows[(start + k) % rows.length]);
    }
    pages.push(page);
    start = (start + pageSize) % rows.length;
  } while (start !== 0);
  return pages;
}

function empaticPodcastCardHtml(r) {
  var portada = empaticImageUrl(r.imagen_portada);
  var mediaAttr = portada ? ' data-bg-url="' + empaticEscapeHtml(portada) + '"' : '';
  var href = 'podcast-episodio.html?slug=' + encodeURIComponent(empaticItemSlug([r.episodio, r.titulo]));
  var spotify = r.link_spotify
    ? '<a href="' + empaticEscapeHtml(r.link_spotify) + '" target="_blank" rel="noopener" class="podcast-icon-btn podcast-icon-btn--spotify" aria-label="Escuchar en Spotify">' + SPOTIFY_ICON_SVG + '</a>'
    : '';
  var youtube = r.link_youtube
    ? '<a href="' + empaticEscapeHtml(r.link_youtube) + '" target="_blank" rel="noopener" class="podcast-icon-btn podcast-icon-btn--youtube" aria-label="Ver en YouTube">' + YOUTUBE_ICON_SVG + '</a>'
    : '';
  return (
    '<div class="podcast-card">' +
      '<a class="podcast-card-link" href="' + href + '">' +
        '<div class="podcast-card-media"' + mediaAttr + ' aria-hidden="true"></div>' +
        '<div class="podcast-card-top">' +
          '<span class="article-card-tag article-card-tag--ready">' + empaticEscapeHtml(r.episodio) + '</span>' +
          '<h3>' + empaticEscapeHtml(r.titulo) + '</h3>' +
          '<p class="podcast-card-guest">' + empaticEscapeHtml(r.invitado) + '</p>' +
        '</div>' +
      '</a>' +
      '<div class="podcast-card-actions">' +
        '<a class="podcast-card-ver" href="' + href + '">Ver Episodio</a>' +
        '<div class="podcast-card-icons">' + spotify + youtube + '</div>' +
      '</div>' +
    '</div>'
  );
}

function empaticPodcastListItemHtml(r) {
  var portada = empaticImageUrl(r.imagen_portada);
  var mediaAttr = portada ? ' data-bg-url="' + empaticEscapeHtml(portada) + '"' : '';
  var href = 'podcast-episodio.html?slug=' + encodeURIComponent(empaticItemSlug([r.episodio, r.titulo]));
  var spotify = r.link_spotify
    ? '<a href="' + empaticEscapeHtml(r.link_spotify) + '" target="_blank" rel="noopener" class="podcast-icon-btn podcast-icon-btn--spotify" aria-label="Escuchar en Spotify">' + SPOTIFY_ICON_SVG + '</a>'
    : '';
  var youtube = r.link_youtube
    ? '<a href="' + empaticEscapeHtml(r.link_youtube) + '" target="_blank" rel="noopener" class="podcast-icon-btn podcast-icon-btn--youtube" aria-label="Ver en YouTube">' + YOUTUBE_ICON_SVG + '</a>'
    : '';
  return (
    '<div class="podcast-list-item">' +
      '<a class="podcast-list-link" href="' + href + '">' +
        '<div class="podcast-list-thumb"' + mediaAttr + ' aria-hidden="true"></div>' +
        '<div class="podcast-list-info">' +
          '<span class="article-card-tag article-card-tag--ready">' + empaticEscapeHtml(r.episodio) + '</span>' +
          '<h4>' + empaticEscapeHtml(r.titulo) + '</h4>' +
          '<p>' + empaticEscapeHtml(r.invitado) + '</p>' +
        '</div>' +
      '</a>' +
      '<div class="podcast-list-actions">' +
        '<a class="podcast-list-ver" href="' + href + '">Ver Episodio</a>' +
        '<div class="podcast-card-icons">' + spotify + youtube + '</div>' +
      '</div>' +
    '</div>'
  );
}

function empaticArticuloCardHtml(r) {
  var miniatura = empaticImageUrl(r.imagen_miniatura);
  var mediaAttr = miniatura ? ' data-bg-url="' + empaticEscapeHtml(miniatura) + '"' : '';
  var href = 'articulo.html?slug=' + encodeURIComponent(empaticItemSlug([r.categoria, r.titulo]));
  return (
    '<a class="article-card" href="' + href + '">' +
      '<div class="article-card-media"' + mediaAttr + ' aria-hidden="true"></div>' +
      '<div class="article-card-body">' +
        '<span class="article-card-tag article-card-tag--ready">' + empaticEscapeHtml(r.categoria) + '</span>' +
        '<h4>' + empaticEscapeHtml(r.titulo) + '</h4>' +
        '<p class="article-card-author">' + empaticEscapeHtml(r.autor) + '</p>' +
        '<span class="article-card-cta">Leer artículo completo →</span>' +
      '</div>' +
    '</a>'
  );
}

var ACTIVIDAD_BOTON_DEFAULT = {
  webinar: 'Ver Grabación en YouTube',
  'taller en campo': 'Ver Galería',
  taller: 'Ver Galería',
  congreso: 'Ver Galería',
  foro: 'Ver Galería'
};

function empaticEsWebinar(tipoActividad) {
  return String(tipoActividad || '').toLowerCase().indexOf('webinar') !== -1;
}

function empaticYoutubeEmbedUrl(url) {
  var match = String(url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{6,})/);
  return match ? 'https://www.youtube.com/embed/' + match[1] : '';
}

function empaticParseGaleria(str) {
  return String(str || '').split('||').map(function (s) { return s.trim(); }).filter(Boolean);
}

function empaticParagraphsHtml(str) {
  var parts = String(str || '').split(/\n\s*\n/).map(function (s) { return s.trim(); }).filter(Boolean);
  if (!parts.length) return '';
  return parts.map(function (p) { return '<p>' + empaticEscapeHtml(p) + '</p>'; }).join('');
}

function empaticActividadCardHtml(r) {
  var portada = empaticImageUrl(r.imagen_portada);
  var attr = portada ? ' data-bg-url="' + empaticEscapeHtml(portada) + '"' : '';
  var href = 'actividad.html?slug=' + encodeURIComponent(empaticItemSlug([r.tipo_actividad, r.titulo]));
  return (
    '<a class="event-item" href="' + href + '"' + attr + '>' +
      '<span class="event-item-tag">' + empaticEscapeHtml(r.tipo_actividad) + '</span>' +
      '<span class="event-item-title">' + empaticEscapeHtml(r.titulo) + '</span>' +
      '<span class="event-item-cta">Ver más →</span>' +
    '</a>'
  );
}

(function () {
  var track = document.getElementById('podcastTrack');
  var nextBtn = document.getElementById('podcastNextBtn');
  var prevBtn = document.getElementById('podcastPrevBtn');
  var verTodosBtn = document.getElementById('podcastVerTodosBtn');
  var modalOverlay = document.getElementById('podcastModalOverlay');
  var modalClose = document.getElementById('podcastModalClose');
  var modalGrid = document.getElementById('podcastModalGrid');
  if (!track || !nextBtn || !prevBtn) return;

  empaticFetchTipo('podcast').then(function (rows) {
    if (!rows.length) {
      track.closest('.novedades-carousel-wrap').style.display = 'none';
      if (verTodosBtn) verTodosBtn.closest('.novedades-ver-todos').style.display = 'none';
      return;
    }
    var pages = empaticBuildCircularPages(rows, PODCAST_PAGE_SIZE);
    var pagesHtml = pages.map(function (pageItems) {
      return '<div class="novedades-page podcast-grid">' + pageItems.map(empaticPodcastCardHtml).join('') + '</div>';
    }).join('');
    track.innerHTML = pagesHtml;
    empaticApplyBgUrls(track);
    initNovedadesCarousel(track, nextBtn, prevBtn, { circular: true, autoplayMs: PODCAST_AUTOPLAY_MS });

    if (verTodosBtn) {
      if (!modalOverlay || !modalGrid) {
        verTodosBtn.closest('.novedades-ver-todos').style.display = 'none';
      } else {
        function openModal() {
          modalGrid.innerHTML = rows.map(empaticPodcastListItemHtml).join('');
          empaticApplyBgUrls(modalGrid);
          modalOverlay.classList.add('is-open');
        }
        function closeModal() {
          modalOverlay.classList.remove('is-open');
        }
        verTodosBtn.addEventListener('click', openModal);
        if (modalClose) modalClose.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', function (e) {
          if (e.target === modalOverlay) closeModal();
        });
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape' && modalOverlay.classList.contains('is-open')) closeModal();
        });
      }
    }
  }).catch(function (err) {
    console.error('No se pudo cargar el podcast:', err);
  }).finally(function () {
    empaticHideLoadingOverlay();
  });
})();

(function () {
  var track = document.getElementById('articulosTrack');
  var nextBtn = document.getElementById('articulosNextBtn');
  var prevBtn = document.getElementById('articulosPrevBtn');
  if (!track || !nextBtn || !prevBtn) return;

  empaticFetchTipo('articulos').then(function (rows) {
    if (!rows.length) {
      track.closest('.novedades-carousel-wrap').style.display = 'none';
      return;
    }
    var pages = empaticBuildCircularPages(rows, ARTICULOS_PAGE_SIZE);
    var pagesHtml = pages.map(function (pageItems) {
      return '<div class="novedades-page grid-3">' + pageItems.map(empaticArticuloCardHtml).join('') + '</div>';
    }).join('');
    track.innerHTML = pagesHtml;
    empaticApplyBgUrls(track);
    initNovedadesCarousel(track, nextBtn, prevBtn, { circular: true });
  }).catch(function (err) {
    console.error('No se pudieron cargar los artículos:', err);
  }).finally(function () {
    empaticHideLoadingOverlay();
  });
})();

(function () {
  var track = document.getElementById('actividadesTrack');
  var nextBtn = document.getElementById('actividadesNextBtn');
  var prevBtn = document.getElementById('actividadesPrevBtn');
  if (!track || !nextBtn || !prevBtn) return;

  empaticFetchTipo('actividades').then(function (rows) {
    if (!rows.length) {
      track.closest('.novedades-carousel-wrap').style.display = 'none';
      return;
    }
    var pages = empaticBuildCircularPages(rows, ACTIVIDADES_PAGE_SIZE);
    var pagesHtml = pages.map(function (pageItems) {
      return '<div class="novedades-page event-gallery">' + pageItems.map(empaticActividadCardHtml).join('') + '</div>';
    }).join('');
    track.innerHTML = pagesHtml;
    empaticApplyBgUrls(track);
    initNovedadesCarousel(track, nextBtn, prevBtn, { circular: true, autoplayMs: ACTIVIDADES_AUTOPLAY_MS });
  }).catch(function (err) {
    console.error('No se pudieron cargar las actividades:', err);
  }).finally(function () {
    empaticHideLoadingOverlay();
  });
})();

/* ---------- Soluciones: tarjetas de servicio desde Google Sheets ---------- */
function empaticSolucionCaracteristicasHtml(str) {
  return String(str || '').split('||').map(function (bullet) {
    bullet = bullet.trim();
    if (!bullet) return '';
    var idx = bullet.indexOf(':');
    if (idx === -1) return '<li>' + empaticEscapeHtml(bullet) + '</li>';
    var label = bullet.slice(0, idx).trim();
    var text = bullet.slice(idx + 1).trim();
    return '<li><strong>' + empaticEscapeHtml(label) + ':</strong> ' + empaticEscapeHtml(text) + '</li>';
  }).join('');
}

function empaticSolucionCardHtml(r) {
  var numero = ('0' + (r.numero || '')).slice(-2);
  var portada = empaticImageUrl(r.imagen_fondo);
  var mediaAttr = portada ? ' data-bg-url="' + empaticEscapeHtml(portada) + '"' : '';
  var waHref = 'https://wa.me/51974131951?text=' + encodeURIComponent(r.whatsapp_mensaje || '');
  return (
    '<div class="sol-card">' +
      '<div class="sol-card-media"' + mediaAttr + ' aria-hidden="true"></div>' +
      '<div class="sol-card-body">' +
        '<div class="sol-title-row">' +
          '<span class="sol-num">' + empaticEscapeHtml(numero) + '</span>' +
          '<span class="sol-kicker">' + empaticEscapeHtml(r.kicker) + '</span>' +
        '</div>' +
        '<p>' + empaticEscapeHtml(r.descripcion) + '</p>' +
        '<ul class="sol-feature-list">' + empaticSolucionCaracteristicasHtml(r.caracteristicas) + '</ul>' +
        '<div class="sol-card-actions">' +
          '<a href="' + waHref + '" target="_blank" rel="noopener" class="btn sol-btn-accent">' + empaticEscapeHtml(r.boton_texto || 'Conocer más') + '</a>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

(function () {
  var grid = document.getElementById('solucionesGrid');
  if (!grid) {
    if (document.querySelector('.page-header--soluciones')) empaticHideLoadingOverlay();
    return;
  }

  empaticFetchTipo('soluciones').then(function (rows) {
    if (!rows.length) return;
    grid.innerHTML = rows.map(empaticSolucionCardHtml).join('');
    empaticApplyBgUrls(grid);
  }).catch(function (err) {
    console.error('No se pudieron cargar las soluciones:', err);
  }).finally(function () {
    empaticHideLoadingOverlay();
  });
})();

/* ---------- Acciones Empáticas: campañas dinamicas del hero desde Google Sheets ---------- */
function empaticAeSlideHtml(r) {
  var bg = empaticImageUrl(r.imagen_fondo);
  var dataBg = bg ? ' data-bg="' + empaticEscapeHtml(bg) + '"' : '';
  var href = 'https://wa.me/51974131951?text=' + encodeURIComponent(r.whatsapp_mensaje || '');
  return (
    '<div class="ae-slide"' + dataBg + '>' +
      '<span class="eyebrow">' + empaticEscapeHtml(r.eyebrow) + '</span>' +
      '<h1>' + empaticEscapeHtml(r.titulo) + '</h1>' +
      '<p>' + empaticEscapeHtml(r.descripcion) + '</p>' +
      '<a href="' + href + '" target="_blank" rel="noopener" class="btn btn-primary ae-slide-cta">' + empaticEscapeHtml(r.boton_texto || 'Quiero participar') + '</a>' +
    '</div>'
  );
}

(function () {
  var slidesContainer = document.getElementById('aeSlides');
  if (!slidesContainer) return;
  var staticSlide = slidesContainer.querySelector('.ae-slide');

  empaticFetchTipo('ae_hero').then(function (rows) {
    if (rows.length && staticSlide) {
      staticSlide.insertAdjacentHTML('beforebegin', rows.map(empaticAeSlideHtml).join(''));
    }
  }).catch(function (err) {
    console.error('No se pudieron cargar las campañas del hero:', err);
  }).then(function () {
    initAeHeroSlider();
  }).finally(function () {
    empaticHideLoadingOverlay();
  });
})();

/* ---------- Mensajes de WhatsApp mantenibles desde Google Sheets (sitewide) ---------- */
(function () {
  var elements = document.querySelectorAll('[data-wa-key]');
  if (!elements.length) return;

  empaticFetchTipo('whatsapp').then(function (rows) {
    var map = {};
    rows.forEach(function (r) { map[r.clave] = r.mensaje; });
    elements.forEach(function (el) {
      var mensaje = map[el.getAttribute('data-wa-key')];
      if (mensaje) {
        el.href = 'https://wa.me/51974131951?text=' + encodeURIComponent(mensaje);
      }
    });
  }).catch(function (err) {
    console.error('No se pudieron cargar los mensajes de WhatsApp:', err);
  });
})();

/* ---------- Paginas propias de detalle: Podcast, Articulo, Actividad ---------- */
function empaticHideLoadingOverlay() {
  var el = document.getElementById('empaticLoadingOverlay');
  if (el) el.classList.add('is-hidden');
}

function empaticDetalleNotFound(titulo, mensaje) {
  var elTitulo = document.getElementById('detTitulo');
  var elDesc = document.getElementById('detDescripcion');
  var elMedia = document.getElementById('detMedia');
  var elSidebar = document.getElementById('detSidebar');
  if (elTitulo) elTitulo.textContent = titulo;
  if (elDesc) elDesc.textContent = mensaje;
  if (elMedia) elMedia.style.display = 'none';
  if (elSidebar) elSidebar.style.display = 'none';
}

(function () {
  var container = document.getElementById('podcastDetalle');
  if (!container) return;
  var slug = empaticGetSlugParam();

  empaticFetchTipo('podcast').then(function (rows) {
    var r = rows.filter(function (row) { return empaticItemSlug([row.episodio, row.titulo]) === slug; })[0];
    if (!r) {
      empaticDetalleNotFound('Episodio no encontrado', 'Es posible que este episodio ya no esté disponible. Vuelve a Novedades para ver los episodios activos.');
      return;
    }
    document.title = r.titulo + ' | Podcast | EMPATIC';
    document.getElementById('detEyebrow').textContent = 'Podcast · ' + (r.episodio || '');
    document.getElementById('detTitulo').textContent = r.titulo;
    document.getElementById('detInvitado').textContent = r.invitado;
    document.getElementById('detDescripcion').textContent = r.descripcion_completa || r.descripcion;
    var bioBlock = document.getElementById('detInvitadoBioBlock');
    if (bioBlock) {
      if (r.invitado_bio) {
        document.getElementById('detInvitadoBio').textContent = r.invitado_bio;
        bioBlock.style.display = '';
      } else {
        bioBlock.style.display = 'none';
      }
    }
    var portada = empaticImageUrl(r.imagen_portada);
    if (portada) empaticSetBackgroundImage(document.getElementById('detMedia'), portada);
    var spotify = r.link_spotify
      ? '<a href="' + empaticEscapeHtml(r.link_spotify) + '" target="_blank" rel="noopener" class="btn btn-primary">Escuchar en Spotify</a>'
      : '';
    var youtube = r.link_youtube
      ? '<a href="' + empaticEscapeHtml(r.link_youtube) + '" target="_blank" rel="noopener" class="btn btn-outline">Ver en YouTube</a>'
      : '';
    document.getElementById('detSidebar').innerHTML =
      '<h4>Escucha o mira el episodio</h4><div class="case-sidebar-actions">' + spotify + youtube + '</div>';
  }).catch(function (err) {
    console.error('No se pudo cargar el episodio:', err);
  }).finally(function () {
    empaticHideLoadingOverlay();
  });
})();

(function () {
  var container = document.getElementById('articuloDetalle');
  if (!container) return;
  var slug = empaticGetSlugParam();

  empaticFetchTipo('articulos').then(function (rows) {
    var r = rows.filter(function (row) { return empaticItemSlug([row.categoria, row.titulo]) === slug; })[0];
    if (!r) {
      empaticDetalleNotFound('Artículo no encontrado', 'Es posible que este artículo ya no esté disponible. Vuelve a Novedades para ver los artículos activos.');
      return;
    }
    document.title = r.titulo + ' | Artículos | EMPATIC';
    document.getElementById('detEyebrow').textContent = 'Artículo · ' + (r.categoria || '');
    document.getElementById('detTitulo').textContent = r.titulo;
    document.getElementById('detInvitado').textContent = r.autor;
    document.getElementById('detDescripcion').innerHTML = empaticParagraphsHtml(r.descripcion_completa || r.descripcion);
    var media = document.getElementById('detMedia');
    var miniatura = empaticImageUrl(r.imagen_miniatura);
    if (media && miniatura) {
      media.style.display = '';
      empaticSetBackgroundImage(media, miniatura);
    }
    var fuente = r.texto_o_link
      ? '<a href="' + empaticEscapeHtml(r.texto_o_link) + '" target="_blank" rel="noopener" class="btn btn-primary">' + empaticEscapeHtml(r.texto_boton || 'Ver fuente original') + '</a>'
      : '';
    document.getElementById('detSidebar').innerHTML =
      '<h4>Fuente</h4><div class="case-sidebar-actions">' + fuente + '</div>';
  }).catch(function (err) {
    console.error('No se pudo cargar el artículo:', err);
  }).finally(function () {
    empaticHideLoadingOverlay();
  });
})();

(function () {
  var container = document.getElementById('actividadDetalle');
  if (!container) return;
  var slug = empaticGetSlugParam();
  var tipo = new URLSearchParams(window.location.search).get('tipo') === 'ae_actividades' ? 'ae_actividades' : 'actividades';

  if (tipo === 'ae_actividades') {
    var backLink = document.getElementById('detBackLink');
    if (backLink) {
      backLink.href = 'acciones-empaticas.html';
      backLink.textContent = '← Volver a Acciones Empáticas';
    }

    empaticFetchTipo('ae_actividades').then(function (rows) {
      var r = rows.filter(function (row) { return empaticItemSlug([row.fecha, row.titulo]) === slug; })[0];
      if (!r) {
        empaticDetalleNotFound('Actividad no encontrada', 'Es posible que esta actividad ya no esté disponible. Vuelve a Acciones Empáticas para ver las actividades activas.');
        return;
      }
      document.title = r.titulo + ' | Acciones Empáticas | EMPATIC';
      document.getElementById('detEyebrow').textContent = 'Acción Empática' + (r.lugar ? ' · ' + r.lugar : '');
      document.getElementById('detTitulo').textContent = r.titulo;
      var elInvitado = document.getElementById('detInvitado');
      if (elInvitado) {
        if (r.fecha) {
          elInvitado.textContent = r.fecha;
          elInvitado.style.display = '';
        } else {
          elInvitado.style.display = 'none';
        }
      }
      document.getElementById('detDescripcion').textContent = r.descripcion || '';

      var media = document.getElementById('detMedia');
      document.getElementById('detVideoEmbed').style.display = 'none';
      document.getElementById('detGaleria').style.display = 'none';
      var portada = empaticImageUrl(r.foto);
      if (portada) {
        media.style.display = '';
        empaticSetBackgroundImage(media, portada);
      } else {
        media.style.display = 'none';
      }
      document.getElementById('detSidebar').style.display = 'none';
    }).catch(function (err) {
      console.error('No se pudo cargar la acción empática:', err);
    }).finally(function () {
      empaticHideLoadingOverlay();
    });
    return;
  }

  empaticFetchTipo('actividades').then(function (rows) {
    var r = rows.filter(function (row) { return empaticItemSlug([row.tipo_actividad, row.titulo]) === slug; })[0];
    if (!r) {
      empaticDetalleNotFound('Actividad no encontrada', 'Es posible que esta actividad ya no esté disponible. Vuelve a Novedades para ver las actividades activas.');
      return;
    }
    document.title = r.titulo + ' | Actividades | EMPATIC';
    document.getElementById('detEyebrow').textContent = 'Actividad · ' + (r.tipo_actividad || '');
    document.getElementById('detTitulo').textContent = r.titulo;
    var elInvitado = document.getElementById('detInvitado');
    if (elInvitado) {
      if (r.lugar_o_organizador) {
        elInvitado.textContent = r.lugar_o_organizador;
        elInvitado.style.display = '';
      } else {
        elInvitado.style.display = 'none';
      }
    }
    document.getElementById('detDescripcion').textContent = r.descripcion || '';

    var media = document.getElementById('detMedia');
    var embedWrap = document.getElementById('detVideoEmbed');
    var galeria = document.getElementById('detGaleria');
    var esWebinar = empaticEsWebinar(r.tipo_actividad);
    var embedUrl = esWebinar ? empaticYoutubeEmbedUrl(r.link_destino) : '';
    var fotos = esWebinar ? [] : empaticParseGaleria(r.imagenes_galeria);

    if (embedUrl) {
      embedWrap.innerHTML = '<iframe src="' + embedUrl + '" title="' + empaticEscapeHtml(r.titulo) + '" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>';
      embedWrap.style.display = '';
      media.style.display = 'none';
      galeria.style.display = 'none';
    } else if (fotos.length) {
      galeria.innerHTML = fotos.map(function (link) {
        var url = empaticImageUrl(link);
        return '<a class="gallery-photo" href="' + empaticEscapeHtml(url) + '" target="_blank" rel="noopener" data-bg-url="' + empaticEscapeHtml(url) + '" aria-label="Ver foto completa de ' + empaticEscapeHtml(r.titulo) + '"></a>';
      }).join('');
      empaticApplyBgUrls(galeria);
      galeria.style.display = '';
      embedWrap.style.display = 'none';
      media.style.display = 'none';
    } else {
      var portada = empaticImageUrl(r.imagen_portada);
      embedWrap.style.display = 'none';
      galeria.style.display = 'none';
      if (portada) {
        media.style.display = '';
        empaticSetBackgroundImage(media, portada);
      } else {
        media.style.display = 'none';
      }
    }

    var boton = r.texto_boton || ACTIVIDAD_BOTON_DEFAULT[String(r.tipo_actividad || '').toLowerCase()] || 'Ver Detalles';
    var botonLink = embedUrl ? 'Ver en YouTube' : boton;
    var link = r.link_destino
      ? '<a href="' + empaticEscapeHtml(r.link_destino) + '" target="_blank" rel="noopener" class="btn ' + (embedUrl ? 'btn-outline' : 'btn-primary') + '">' + empaticEscapeHtml(botonLink) + '</a>'
      : '';
    document.getElementById('detSidebar').innerHTML =
      '<h4>Más información</h4><div class="case-sidebar-actions">' + link + '</div>';
  }).catch(function (err) {
    console.error('No se pudo cargar la actividad:', err);
  }).finally(function () {
    empaticHideLoadingOverlay();
  });
})();

/* ---------- Negocios Sostenibles: carrusel de empresas desde Google Sheets ---------- */
var BIZ_LOGO_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';

function empaticBizCardHtml(r, hidden) {
  var tag = r.slug ? 'Caso destacado' : 'Próximamente';
  var portada = empaticImageUrl(r.imagen_portada);
  var cls = 'biz-card-mini' + (portada ? ' biz-card-mini--photo' : '');
  var bgAttr = portada ? ' data-bg-url="' + empaticEscapeHtml(portada) + '"' : '';
  var hiddenAttrs = hidden ? ' aria-hidden="true" tabindex="-1"' : '';
  var inner =
    '<div class="biz-card-top">' +
      '<div class="biz-card-logo" aria-hidden="true">' + BIZ_LOGO_SVG + '</div>' +
      '<span class="biz-card-tag">' + empaticEscapeHtml(tag) + '</span>' +
    '</div>' +
    '<span class="biz-card-sector">' + empaticEscapeHtml(r.sector) + '</span>' +
    '<h4>' + empaticEscapeHtml(r.nombre) + '</h4>' +
    '<p>' + empaticEscapeHtml(r.resumen) + '</p>';
  if (r.slug) {
    return '<a href="caso.html?slug=' + encodeURIComponent(r.slug) + '" class="' + cls + '"' + bgAttr + hiddenAttrs + '>' + inner + '</a>';
  }
  return '<div class="' + cls + '"' + bgAttr + hiddenAttrs + '>' + inner + '</div>';
}

(function () {
  var tracks = [
    document.getElementById('bizTrack1'),
    document.getElementById('bizTrack2'),
    document.getElementById('bizTrack3')
  ];
  if (!tracks[0] || !tracks[1] || !tracks[2]) return;

  empaticFetchTipo('negocios').then(function (rows) {
    if (!rows.length) {
      tracks.forEach(function (t) { t.closest('.biz-row').style.display = 'none'; });
      return;
    }
    var groups = [[], [], []];
    rows.forEach(function (r, i) { groups[i % 3].push(r); });
    groups.forEach(function (group, idx) {
      var track = tracks[idx];
      if (!group.length) {
        track.closest('.biz-row').style.display = 'none';
        return;
      }
      var visible = group.map(function (r) { return empaticBizCardHtml(r, false); }).join('');
      var duplicate = group.map(function (r) { return empaticBizCardHtml(r, true); }).join('');
      track.innerHTML = visible + duplicate;
      empaticApplyBgUrls(track);
    });
  }).catch(function (err) {
    console.error('No se pudieron cargar los negocios:', err);
  }).finally(function () {
    empaticHideLoadingOverlay();
  });
})();

/* ---------- Acciones Empaticas: carrusel de actividades realizadas (tab AE_ACTIVIDADES) ---------- */
var AE_ACTIVIDADES_PAGE_SIZE = 3;
var AE_ACTIVIDADES_AUTOPLAY_MS = 8000;

function empaticAeActividadCardHtml(r) {
  var foto = empaticImageUrl(r.foto);
  var attr = foto ? ' data-bg-url="' + empaticEscapeHtml(foto) + '"' : '';
  var tag = r.fecha || r.lugar || '';
  var slug = empaticItemSlug([r.fecha, r.titulo]);
  var href = 'actividad.html?tipo=ae_actividades&slug=' + encodeURIComponent(slug);
  return (
    '<a href="' + href + '" class="event-item"' + attr + '>' +
      (tag ? '<span class="event-item-tag">' + empaticEscapeHtml(tag) + '</span>' : '') +
      '<span class="event-item-title">' + empaticEscapeHtml(r.titulo) + '</span>' +
      '<span class="event-item-cta">Ver más →</span>' +
    '</a>'
  );
}

(function () {
  var section = document.getElementById('ae-actividades-section');
  var track = document.getElementById('aeActividadesTrack');
  var nextBtn = document.getElementById('aeActividadesNextBtn');
  var prevBtn = document.getElementById('aeActividadesPrevBtn');
  if (!section || !track || !nextBtn || !prevBtn) return;

  empaticFetchTipo('ae_actividades').then(function (rows) {
    if (!rows.length) {
      section.style.display = 'none';
      return;
    }
    var pages = empaticBuildCircularPages(rows, AE_ACTIVIDADES_PAGE_SIZE);
    var pagesHtml = pages.map(function (pageItems) {
      return '<div class="novedades-page event-gallery">' + pageItems.map(empaticAeActividadCardHtml).join('') + '</div>';
    }).join('');
    track.innerHTML = pagesHtml;
    empaticApplyBgUrls(track);
    initNovedadesCarousel(track, nextBtn, prevBtn, { circular: true, autoplayMs: AE_ACTIVIDADES_AUTOPLAY_MS });
  }).catch(function (err) {
    console.error('No se pudieron cargar las actividades de Acciones Empáticas:', err);
    section.style.display = 'none';
  }).finally(function () {
    empaticHideLoadingOverlay();
  });
})();

/* ---------- Formulario de inscripción a cursos (EMPATIC Academy) ---------- */
(function () {
  var form = document.querySelector('[data-curso-form]');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var submitBtn = form.querySelector('button[type="submit"]');
    var originalLabel = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
    }

    var body = new URLSearchParams({
      curso_slug: form.getAttribute('data-curso-slug') || '',
      curso_nombre: form.getAttribute('data-curso-nombre') || '',
      nombres: form.querySelector('[name="first_name"]').value,
      apellidos: form.querySelector('[name="last_name"]').value,
      email: form.querySelector('[name="email"]').value,
      telefono: form.querySelector('[name="phone"]').value,
      institucion: form.querySelector('[name="institucion"]').value,
      carrera: form.querySelector('[name="carrera"]').value,
      situacion: form.querySelector('[name="situacion"]').value,
    });

    fetch(EMPATIC_API, { method: 'POST', mode: 'no-cors', body: body })
      .then(function () {
        form.innerHTML = '<span class="course-hero-form-tag">✅&nbsp; Inscripción recibida</span>'
          + '<h4>¡Gracias por inscribirte!</h4>'
          + '<p class="contact-form-note">Te contactaremos pronto con los siguientes pasos.</p>';
      })
      .catch(function (err) {
        console.error('No se pudo enviar la inscripción:', err);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        }
        alert('Hubo un problema al enviar tu inscripción. Inténtalo nuevamente.');
      });
  });
})();

/* ---------- EMPATIC Academy: carrusel de cursos (EMPATIC - Cursos) ---------- */
function empaticCursoCardHtml(r) {
  var foto = empaticImageUrl(r.imagen_fondo);
  var photoClass = foto ? ' curso-card--photo' : '';
  var attr = foto ? ' data-bg-url="' + empaticEscapeHtml(foto) + '"' : '';
  var inner =
    '<span class="biz-card-tag">' + empaticEscapeHtml(r.card_tag || 'Ver curso') + '</span>' +
    '<h4>' + empaticEscapeHtml(r.titulo) + '</h4>' +
    '<p>' + empaticEscapeHtml(r.card_resumen) + '</p>';

  if (r.slug) {
    return '<a href="curso.html?slug=' + encodeURIComponent(r.slug) + '" class="curso-card' + photoClass + '"' + attr + '>'
      + inner + '<span class="btn btn-primary btn-sm">Ver curso</span></a>';
  }
  return '<div class="curso-card' + photoClass + '"' + attr + '>' + inner + '</div>';
}

(function () {
  var track = document.getElementById('cursosTrack');
  var nextBtn = document.getElementById('cursosNextBtn');
  var prevBtn = document.getElementById('cursosPrevBtn');
  if (!track || !nextBtn || !prevBtn) return;

  empaticFetchTipo('cursos').then(function (rows) {
    var activos = rows.filter(function (r) { return String(r.activo || '').toUpperCase() === 'SI'; });
    if (!activos.length) return;

    var pages = empaticBuildCircularPages(activos, CURSOS_PAGE_SIZE);
    var pagesHtml = pages.map(function (pageItems) {
      return '<div class="novedades-page cursos-grid">' + pageItems.map(empaticCursoCardHtml).join('') + '</div>';
    }).join('');
    track.innerHTML = pagesHtml;
    empaticApplyBgUrls(track);
    initNovedadesCarousel(track, nextBtn, prevBtn, { circular: true });
  }).catch(function (err) {
    console.error('No se pudieron cargar los cursos de EMPATIC Academy:', err);
  }).finally(function () {
    empaticHideLoadingOverlay();
  });
})();

/* ---------- Pagina de detalle: Caso de exito (negocios) ---------- */
function empaticBarSplitHtml(str) {
  var parts = String(str || '').split('||').map(function (s) { return s.trim(); }).filter(Boolean);
  return parts.map(function (p) { return '<p>' + empaticEscapeHtml(p) + '</p>'; }).join('');
}

(function () {
  var container = document.getElementById('casoDetalle');
  if (!container) return;
  var slug = empaticGetSlugParam();

  empaticFetchTipo('negocios').then(function (rows) {
    var r = rows.filter(function (row) { return row.slug === slug; })[0];
    if (!r) {
      empaticDetalleNotFound('Caso no encontrado', 'Es posible que este caso ya no esté disponible. Vuelve a la Red de Negocios para ver los casos activos.');
      return;
    }
    document.title = r.nombre + ' | Casos de Éxito | EMPATIC';
    document.getElementById('detEyebrow').textContent = r.eyebrow || 'Caso de éxito';
    document.getElementById('detTitulo').textContent = r.titular;
    var elCita = document.getElementById('detInvitado');
    if (elCita) elCita.textContent = r.cita ? '"' + r.cita + '"' : '';
    var elAtrib = document.getElementById('detAtribucion');
    if (elAtrib) elAtrib.textContent = r.atribucion || '';
    document.getElementById('detDescripcion').innerHTML = empaticBarSplitHtml(r.historia);

    var podcastBlock = document.getElementById('detPodcastBlock');
    if (podcastBlock) {
      if (r.podcast_titulo) {
        document.getElementById('detPodcastTitulo').textContent = r.podcast_titulo;
        document.getElementById('detPodcastDescripcion').textContent = r.podcast_descripcion || '';
        podcastBlock.style.display = '';
      } else {
        podcastBlock.style.display = 'none';
      }
    }

    var metrics = [
      [r.metrica1_valor, r.metrica1_label],
      [r.metrica2_valor, r.metrica2_label],
      [r.metrica3_valor, r.metrica3_label]
    ].filter(function (m) { return m[0]; });
    var metricsBlock = document.getElementById('detMetricsBlock');
    if (metricsBlock) {
      if (metrics.length) {
        document.getElementById('detMetrics').innerHTML = metrics.map(function (m) {
          return '<div class="case-metric"><div class="num">' + empaticEscapeHtml(m[0]) + '</div><p>' + empaticEscapeHtml(m[1]) + '</p></div>';
        }).join('');
        metricsBlock.style.display = '';
      } else {
        metricsBlock.style.display = 'none';
      }
    }

    document.getElementById('detSidebar').innerHTML =
      '<div class="case-sidebar-logo" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div>' +
      '<h4>' + empaticEscapeHtml(r.nombre) + '</h4>' +
      '<dl class="case-sidebar-facts">' +
        '<div><dt>Sector</dt><dd>' + empaticEscapeHtml(r.sector) + '</dd></div>' +
        '<div><dt>Región de impacto</dt><dd>' + empaticEscapeHtml(r.ubicacion) + '</dd></div>' +
      '</dl>' +
      '<div class="case-sidebar-links">' +
        (r.sitio_web ? '<a href="' + empaticEscapeHtml(r.sitio_web) + '" target="_blank" rel="noopener" aria-label="Sitio web de ' + empaticEscapeHtml(r.nombre) + '"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 6 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-6-3.8-9S9.5 5.7 12 3Z"/></svg></a>' : '') +
        (r.linkedin ? '<a href="' + empaticEscapeHtml(r.linkedin) + '" target="_blank" rel="noopener" aria-label="LinkedIn de ' + empaticEscapeHtml(r.nombre) + '"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7.5 10.5v6M7.5 7.5v.01M11.5 16.5v-4c0-1.5 1-2.4 2.3-2.4 1.3 0 2.2.9 2.2 2.4v4"/></svg></a>' : '') +
        (r.instagram ? '<a href="' + empaticEscapeHtml(r.instagram) + '" target="_blank" rel="noopener" aria-label="Instagram de ' + empaticEscapeHtml(r.nombre) + '"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/></svg></a>' : '') +
      '</div>';
  }).catch(function (err) {
    console.error('No se pudo cargar el caso:', err);
  }).finally(function () {
    empaticHideLoadingOverlay();
  });
})();

/* ---------- Pagina de detalle: Curso (EMPATIC Academy) ---------- */
(function () {
  var container = document.getElementById('cursoDetalle');
  if (!container) return;
  var slug = empaticGetSlugParam();

  Promise.all([
    empaticFetchTipo('cursos'),
    empaticFetchTipo('programas')
  ]).then(function (results) {
    var cursos = results[0], programas = results[1];
    var r = cursos.filter(function (row) { return row.slug === slug; })[0];
    if (!r) {
      empaticDetalleNotFound('Curso no encontrado', 'Es posible que este curso ya no esté disponible. Vuelve a EMPATIC Academy para ver los cursos activos.');
      return;
    }
    var programaId = String(r.programa || '').toLowerCase();
    var programaRow = programas.filter(function (p) { return String(p.id || '').toLowerCase() === programaId; })[0] || {};
    var detalle = EMPATIC_CURSO_DETAIL[r.slug] || {};
    var programaDetalle = EMPATIC_PROGRAMA_DETAIL[programaId] || {};

    document.title = r.titulo + ' | EMPATIC Academy';
    document.getElementById('detEyebrow').textContent = programaId.toUpperCase() + (programaRow.nombre ? ' · ' + programaRow.nombre : ' · EMPATIC Academy');
    document.getElementById('detTitulo').textContent = r.titulo;
    document.getElementById('detDescripcion').textContent = detalle.objetivo || r.descripcion || '';

    var bannerSrc = EMPATIC_PROGRAMA_BANNERS[programaId];
    var bgImage = bannerSrc || empaticImageUrl(r.imagen_fondo);
    if (bgImage) container.style.setProperty('--course-bg-image', 'url(\'' + bgImage + '\')');

    var discountBanner = document.getElementById('detDiscountBanner');
    if (discountBanner) {
      if (String(r.tiene_descuento || '').toUpperCase() === 'SI' && r.descuento_texto !== '' && r.descuento_texto != null) {
        var descuentoTexto = r.descuento_texto;
        if (typeof descuentoTexto === 'number') {
          descuentoTexto = Math.round(descuentoTexto * 100) + '% de descuento';
        }
        discountBanner.textContent = descuentoTexto;
        discountBanner.style.display = '';
      } else {
        discountBanner.style.display = 'none';
      }
    }

    var metaItems = [
      ['Fechas', detalle.fechasTexto || r.inicio],
      ['Duración', r.duracion],
      ['Modalidad', r.modalidad]
    ].filter(function (m) { return m[1]; });
    document.getElementById('detMetaRow').innerHTML = metaItems.map(function (m) {
      return '<li><span>' + empaticEscapeHtml(m[0]) + '</span>' + empaticEscapeHtml(m[1]) + '</li>';
    }).join('');

    var precioEl = document.getElementById('detPrecio');
    if (precioEl) {
      precioEl.innerHTML = empaticEscapeHtml(r.inversion || '') + (r.precio_aliado ? '<small>Miembros de instituciones aliadas: ' + empaticEscapeHtml(r.precio_aliado) + '</small>' : '');
    }

    var btnMatricula = document.getElementById('detBtnMatricula');
    if (btnMatricula) btnMatricula.href = programaRow.form_link || r.form_link || '#';
    var btnBrochure = document.getElementById('detBtnBrochure');
    if (btnBrochure) btnBrochure.href = programaDetalle.brochureLink || '#';

    var volverPrograma = document.getElementById('detVolverPrograma');
    if (volverPrograma) {
      volverPrograma.href = 'programa.html?id=' + encodeURIComponent(programaId);
      volverPrograma.textContent = '← Volver al programa' + (programaRow.nombre ? ' ' + programaRow.nombre : '');
    }

    var aprenderasList = document.getElementById('detAprenderas');
    if (aprenderasList) {
      var aprenderas = detalle.aprenderas || [];
      aprenderasList.innerHTML = aprenderas.map(function (item) {
        return '<li><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span>' + empaticEscapeHtml(item) + '</span></li>';
      }).join('');
    }
    var paraQueSirveEl = document.getElementById('detParaQueSirve');
    if (paraQueSirveEl) paraQueSirveEl.textContent = detalle.paraQueSirve || '';
    var dirigidoAEl = document.getElementById('detDirigidoA');
    if (dirigidoAEl) dirigidoAEl.textContent = programaDetalle.dirigidoA || '';
  }).catch(function (err) {
    console.error('No se pudo cargar el curso:', err);
  }).finally(function () {
    empaticHideLoadingOverlay();
  });
})();

/* ---------- Pagina de detalle: Programa (EMPATIC Academy) ---------- */
(function () {
  var container = document.getElementById('programaDetalle');
  if (!container) return;
  var id = (new URLSearchParams(window.location.search).get('id') || '').toLowerCase();

  Promise.all([
    empaticFetchTipo('programas'),
    empaticFetchTipo('cursos')
  ]).then(function (results) {
    var programas = results[0], cursos = results[1];
    var r = programas.filter(function (row) { return String(row.id || '').toLowerCase() === id; })[0];
    if (!r) {
      empaticDetalleNotFound('Programa no encontrado', 'Es posible que este programa ya no esté disponible. Vuelve a EMPATIC Academy para ver los programas activos.');
      return;
    }
    var idUpper = String(r.id || '').toUpperCase();
    var detalle = EMPATIC_PROGRAMA_DETAIL[id] || {};

    document.title = idUpper + ' · ' + r.nombre + ' | EMPATIC Academy';
    document.getElementById('detEyebrow').textContent = 'Programa de Especialización · ' + idUpper;
    document.getElementById('detTitulo').textContent = idUpper + ' · ' + r.nombre;
    document.getElementById('detDescripcion').textContent = detalle.objetivoGeneral || '';

    var bannerSrc = EMPATIC_PROGRAMA_BANNERS[id];
    if (bannerSrc) container.style.setProperty('--course-bg-image', 'url(\'' + bannerSrc + '\')');

    var aliado = r.aliado ? ' · Aliado: ' + r.aliado : '';
    var metaItems = [
      ['Día y horario', r.dia + ' · ' + r.horario + aliado],
      ['Fechas', detalle.fechasTexto],
      ['Duración', detalle.duracionTexto],
      ['Certificación', detalle.certificacion]
    ].filter(function (m) { return m[1]; });
    document.getElementById('detMetaRow').innerHTML = metaItems.map(function (m) {
      return '<li><span>' + empaticEscapeHtml(m[0]) + '</span>' + empaticEscapeHtml(m[1]) + '</li>';
    }).join('');

    var precioEl = document.getElementById('detPrecio');
    if (precioEl) {
      precioEl.innerHTML = empaticEscapeHtml(r.precio_contado || '') + ' al contado'
        + (r.precio_cuotas ? '<small>o ' + empaticEscapeHtml(r.precio_cuotas) + '</small>' : '');
    }

    var btnMatricula = document.getElementById('detBtnMatricula');
    if (btnMatricula) btnMatricula.href = r.form_link || '#';
    var btnBrochure = document.getElementById('detBtnBrochure');
    if (btnBrochure) btnBrochure.href = detalle.brochureLink || '#';

    var presentacionEl = document.getElementById('detPresentacion');
    if (presentacionEl) {
      var presentacion = detalle.presentacion || [];
      presentacionEl.innerHTML = '<h2>Presentación</h2>' + presentacion.map(function (p) {
        return '<p>' + empaticEscapeHtml(p) + '</p>';
      }).join('');
    }

    var competenciasList = document.getElementById('detCompetencias');
    if (competenciasList) {
      var competencias = detalle.competencias || [];
      competenciasList.innerHTML = competencias.map(function (item) {
        return '<li><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span>' + empaticEscapeHtml(item) + '</span></li>';
      }).join('');
    }

    var dirigidoAEl = document.getElementById('detDirigidoA');
    if (dirigidoAEl) dirigidoAEl.textContent = detalle.dirigidoA || '';

    var perfilesList = document.getElementById('detPerfiles');
    if (perfilesList) {
      var perfiles = detalle.perfiles || [];
      perfilesList.innerHTML = perfiles.map(function (item) {
        return '<li><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span>' + empaticEscapeHtml(item) + '</span></li>';
      }).join('');
    }

    var cursosDelPrograma = cursos.filter(function (c) { return String(c.programa || '').toLowerCase() === id; })
      .sort(function (a, b) { return (Number(a.p) || 0) - (Number(b.p) || 0); });
    var cursosListEl = document.getElementById('detCursosList');
    if (cursosListEl) {
      cursosListEl.innerHTML = cursosDelPrograma.map(function (c) {
        return '<li><a href="curso.html?slug=' + encodeURIComponent(c.slug) + '">' +
          '<span class="detail-cursos-mes">' + empaticEscapeHtml(c.mes || '') + '</span>' +
          '<span>' + empaticEscapeHtml(c.titulo) + '</span>' +
        '</a></li>';
      }).join('');
    }
  }).catch(function (err) {
    console.error('No se pudo cargar el programa:', err);
  }).finally(function () {
    empaticHideLoadingOverlay();
  });
})();

/* ---------- EMPATIC Academy: Programas/Cursos/Workshops desde Google Sheets ---------- */
/* Calco de spda.org.pe/formacion: cada fila (.academy-feature) tiene su propio
   fundido de entrada al hacer scroll (ScrollReveal-like, una sola vez), y aparte
   su propio hover (puro CSS, ver styles.css) que revela la imagen y el texto.
   No hay logica de "cual esta activa": cada fila es independiente. */
var empaticRevealObserver = (typeof IntersectionObserver !== 'undefined')
  ? new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          empaticRevealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -80px 0px' })
  : null;

function empaticActivateScrollEffects(root) {
  var scope = root || document;
  Array.prototype.forEach.call(scope.querySelectorAll('.reveal-up:not(.is-visible)'), function (el) {
    if (empaticRevealObserver) empaticRevealObserver.observe(el);
    else el.classList.add('is-visible');
  });
}

empaticActivateScrollEffects(document);

/* Contenido extendido de cada programa y curso (Contenido_Web_EMPATIC_Academy_Programas_2027.pdf),
   para las paginas de detalle programa.html / curso.html ("leer mas"). No viene del Sheet porque
   es texto fijo, largo, que no cambia con la campana o las fechas. */
var EMPATIC_PROGRAMA_DETAIL = {
  p1: {
    presentacion: [
      'La viabilidad de un proyecto minero, energético o de infraestructura ya no depende solo de su ingeniería: depende de la confianza que construye con las comunidades y el territorio donde opera.',
      'Este programa forma profesionales capaces de diseñar y gestionar el relacionamiento comunitario de principio a fin: licencia social, mapeo de actores y riesgos, planes de relaciones comunitarias, prevención de conflictos socioambientales, cumplimiento de compromisos y desarrollo económico local.',
      'Al terminar, tendrás un portafolio de 6 productos aplicados que puedes usar en tu trabajo.'
    ],
    objetivoGeneral: 'Diseñar y gestionar estrategias de relacionamiento comunitario que fortalezcan la licencia social de los proyectos, prevengan conflictos y aseguren el cumplimiento de compromisos en el territorio.',
    competencias: [
      'Analizar la licencia social y los riesgos sociales de un proyecto.',
      'Diseñar estrategias de relacionamiento comunitario.',
      'Prevenir y gestionar conflictos socioambientales con enfoque de diálogo.',
      'Gestionar compromisos sociales y el desarrollo económico local.'
    ],
    dirigidoA: 'Profesionales de ciencias sociales, ingeniería, derecho y carreras afines que trabajan o quieren trabajar en la gestión social de proyectos mineros, energéticos y de infraestructura, en empresas, consultoras, Estado u ONG.',
    perfiles: [
      'Profesionales de relaciones comunitarias y gestión social',
      'Sociólogos, antropólogos y trabajadores sociales',
      'Supervisores y consultores de proyectos de inversión',
      'Funcionarios de oficinas de diálogo y gestión social del Estado'
    ],
    fechasTexto: 'Del 5 de enero al 22 de junio de 2027',
    duracionTexto: '6 cursos · 6 meses · 144 horas académicas',
    formaTrabajo: '4 sesiones en vivo por curso + proyecto aplicativo final en Moodle. Al terminar el programa tendrás un portafolio de 6 productos aplicados a tu trabajo.',
    certificacion: 'EMPATIC Academy y Colegio de Sociólogos del Perú (144 horas académicas)',
    brochureLink: '[PEGAR ENLACE BROCHURE P1]'
  },
  p2: {
    presentacion: [
      'Una obra de infraestructura puede tener financiamiento y expediente técnico, y aun así detenerse por un solo predio sin liberar o por no cumplir lo que exigen el cliente y los financiadores.',
      'Este programa forma profesionales capaces de conducir la liberación de áreas de principio a fin: marco legal del D. Leg. 1192, saneamiento físico-legal, requerimientos socioambientales del Banco Mundial, BID e IFC, empadronamiento con herramientas digitales, reasentamiento y PACRI, y negociación con la población afectada.',
      'Al terminar, tendrás un portafolio de 6 productos aplicados que puedes usar en tu trabajo.'
    ],
    objetivoGeneral: 'Gestionar la liberación de áreas para proyectos de infraestructura integrando el marco legal predial con los requerimientos socioambientales de clientes y financiadores.',
    competencias: [
      'Aplicar el marco legal de adquisición y liberación de predios.',
      'Diagnosticar y orientar el saneamiento de predios.',
      'Cumplir los estándares socioambientales de financiadores en reasentamiento y compensación.',
      'Caracterizar y negociar con la población afectada.'
    ],
    dirigidoA: 'Profesionales de derecho, ingeniería, ciencias sociales y carreras afines que trabajan o quieren trabajar en la liberación de áreas de proyectos de infraestructura, en empresas, concesionarias, consultoras o el Estado.',
    perfiles: [
      'Abogados y gestores prediales',
      'Ingenieros civiles, topógrafos y arquitectos',
      'Sociólogos, antropólogos y trabajadores sociales',
      'Funcionarios de entidades a cargo de obras'
    ],
    fechasTexto: 'Del 6 de enero al 23 de junio de 2027',
    duracionTexto: '6 cursos · 6 meses · 144 horas académicas',
    formaTrabajo: '4 sesiones en vivo por curso + proyecto aplicativo final en Moodle. Al terminar el programa tendrás un portafolio de 6 productos aplicados a tu trabajo.',
    certificacion: 'EMPATIC Academy (144 horas académicas)',
    brochureLink: '[PEGAR ENLACE BROCHURE P2]'
  },
  p3: {
    presentacion: [
      'El Fenómeno El Niño y las lluvias intensas golpean cada cierto tiempo a miles de familias en el Perú: viviendas, salud, educación, agua y medios de vida se ven afectados, y el cambio climático aumenta ese riesgo.',
      'Este programa forma profesionales capaces de gestionar el riesgo de desastres antes, durante y después de una emergencia: escenarios de riesgo, planes de contingencia y alerta temprana, EDAN y empadronamiento, gestión del agua y soluciones basadas en la naturaleza, asistencia humanitaria y reconstrucción resiliente.',
      'Al terminar, tendrás un portafolio de 6 productos aplicados que puedes usar en tu trabajo.'
    ],
    objetivoGeneral: 'Gestionar el riesgo de desastres asociados al cambio climático y al Fenómeno El Niño con planes y herramientas que protejan a las poblaciones vulnerables y aceleren la recuperación.',
    competencias: [
      'Analizar escenarios de riesgo ante El Niño y el cambio climático.',
      'Organizar la preparación y la alerta temprana comunitaria.',
      'Gestionar la respuesta, la asistencia humanitaria y la focalización.',
      'Planificar la reconstrucción resiliente.'
    ],
    dirigidoA: 'Profesionales de ciencias sociales, ingeniería, salud y carreras afines que trabajan o quieren trabajar en gestión del riesgo, cambio climático, respuesta a emergencias y reconstrucción.',
    perfiles: [
      'Profesionales de gestión del riesgo de desastres y defensa civil',
      'Sociólogos, antropólogos y trabajadores sociales',
      'Ingenieros ambientales, civiles y geógrafos',
      'Funcionarios de gobiernos locales, programas sociales y ONG'
    ],
    fechasTexto: 'Del 7 de enero al 24 de junio de 2027',
    duracionTexto: '6 cursos · 6 meses · 144 horas académicas',
    formaTrabajo: '4 sesiones en vivo por curso + proyecto aplicativo final en Moodle. Al terminar el programa tendrás un portafolio de 6 productos aplicados a tu trabajo.',
    certificacion: 'EMPATIC Academy y Colegio de Sociólogos del Perú (144 horas académicas)',
    brochureLink: '[PEGAR ENLACE BROCHURE P3]'
  },
  p4: {
    presentacion: [
      'Las mineras, energéticas, constructoras y agroexportadoras ya exigen a sus proveedores criterios ASG: huella de carbono, cumplimiento legal, políticas y evidencias. Quien no cumple, no se homologa y pierde contratos.',
      'Este programa forma profesionales capaces de llevar a una empresa proveedora al cumplimiento ASG: diagnóstico de brechas, huella de carbono e hídrica con estándares ISO, ecoeficiencia con ahorro en soles, matriz de cumplimiento legal y homologación con tableros digitales.',
      'Al terminar, tendrás un portafolio de 6 productos aplicados que puedes usar en tu trabajo.'
    ],
    objetivoGeneral: 'Llevar a una empresa proveedora al cumplimiento de criterios ASG que exigen sus clientes, bancos e inversionistas, con herramientas medibles y rentables.',
    competencias: [
      'Evaluar el desempeño ASG de una empresa y priorizar brechas.',
      'Medir y gestionar la huella de carbono e hídrica.',
      'Gestionar el cumplimiento legal ambiental, social y de SST.',
      'Preparar a la empresa para la homologación de proveedores.'
    ],
    dirigidoA: 'Profesionales que trabajan o quieren trabajar en sostenibilidad, medio ambiente, SST o gestión de empresas proveedoras y contratistas de minería, energía, construcción y agroexportación.',
    perfiles: [
      'Jefes de SSOMA, calidad y sostenibilidad',
      'Ingenieros ambientales e industriales',
      'Administradores, contadores y economistas',
      'Gerentes y dueños de empresas proveedoras y contratistas'
    ],
    fechasTexto: 'Del 9 de enero al 26 de junio de 2027',
    duracionTexto: '6 cursos · 6 meses · 144 horas académicas',
    formaTrabajo: '4 sesiones en vivo por curso + proyecto aplicativo final en Moodle. Al terminar el programa tendrás un portafolio de 6 productos aplicados a tu trabajo.',
    certificacion: 'EMPATIC Academy (144 horas académicas)',
    brochureLink: '[PEGAR ENLACE BROCHURE P4]'
  }
};

var EMPATIC_CURSO_DETAIL = {
  'licencia-social-para-operar-estrategia-gobernanza-y-gestion': {
    objetivo: 'Comprender qué sostiene la licencia social de un proyecto y cómo fortalecerla y medirla en el territorio.',
    aprenderas: ['Qué es la licencia social y qué la fortalece o la debilita', 'Cómo leer la gobernanza de un territorio y sus actores clave', 'Cómo medir la licencia social con indicadores'],
    paraQueSirve: 'Para anticipar riesgos sociales y sostener la relación de un proyecto con su entorno.',
    fechasTexto: 'Martes 5 de enero, 12 de enero, 19 de enero, 26 de enero de 2027'
  },
  'mapeo-de-actores-y-gestion-de-riesgos-sociales-en-proyectos': {
    objetivo: 'Desarrollar capacidades para identificar actores y anticipar riesgos sociales en proyectos de inversión.',
    aprenderas: ['Cómo identificar y caracterizar a los actores de un proyecto', 'Cómo analizar su poder, interés e influencia', 'Cómo valorar y priorizar riesgos sociales'],
    paraQueSirve: 'Para tomar decisiones informadas antes y durante la ejecución de un proyecto.',
    fechasTexto: 'Martes 2 de febrero, 9 de febrero, 16 de febrero, 23 de febrero de 2027'
  },
  'diseno-y-gestion-de-planes-de-relaciones-comunitarias-en-pro': {
    objetivo: 'Desarrollar capacidades para diseñar y gestionar el relacionamiento comunitario de proyectos extractivos y de infraestructura.',
    aprenderas: ['Qué exige la normativa y los estándares en relaciones comunitarias', 'Cómo pasar del diagnóstico social a programas concretos', 'Cómo planificar, presupuestar y medir un plan de relaciones comunitarias'],
    paraQueSirve: 'Para diseñar y gestionar el relacionamiento comunitario de proyectos extractivos y de infraestructura.',
    fechasTexto: 'Martes 2 de marzo, 9 de marzo, 16 de marzo, 23 de marzo de 2027'
  },
  'gestion-y-prevencion-de-conflictos-socioambientales-dialogo': {
    objetivo: 'Fortalecer capacidades para prevenir, analizar y gestionar conflictos socioambientales con enfoque de diálogo.',
    aprenderas: ['Cómo se originan y escalan los conflictos socioambientales en el Perú', 'Cómo prevenirlos con alerta temprana', 'Técnicas de diálogo, negociación y mediación'],
    paraQueSirve: 'Para prevenir y gestionar conflictos con enfoque de diálogo.',
    fechasTexto: 'Martes 6 de abril, 13 de abril, 20 de abril, 27 de abril de 2027'
  },
  'gestion-de-compromisos-sociales-cumplimiento-y-evaluacion-de': {
    objetivo: 'Fortalecer la gestión de los compromisos sociales y la evaluación de impactos socioambientales con evidencia.',
    aprenderas: ['De dónde nacen los compromisos sociales y cómo registrarlos', 'Cómo evaluar impactos socioambientales', 'Cómo demostrar el cumplimiento con evidencias'],
    paraQueSirve: 'Para responder ante clientes, autoridades y comunidades con evidencia de cumplimiento.',
    fechasTexto: 'Martes 4 de mayo, 11 de mayo, 18 de mayo, 25 de mayo de 2027'
  },
  'desarrollo-economico-local-gestion-de-empleo-y-cadenas-de-pr': {
    objetivo: 'Comprender cómo promover el empleo y los proveedores locales bajo los estándares que exigen las empresas.',
    aprenderas: ['Cómo funcionan el empleo y las compras locales en proyectos', 'Qué estándares exigen las empresas a sus programas locales', 'Cómo diseñar y medir un programa de desarrollo económico local'],
    paraQueSirve: 'Para generar valor en el territorio y cumplir lo que piden las empresas mandantes.',
    fechasTexto: 'Martes 1 de junio, 8 de junio, 15 de junio, 22 de junio de 2027'
  },
  'adquisicion-y-liberacion-de-predios-para-obras-de-infraestru': {
    objetivo: 'Conocer el marco legal y el procedimiento de adquisición y liberación de predios para obras de infraestructura.',
    aprenderas: ['El marco legal de adquisición y liberación de predios', 'El procedimiento de trato directo y sus plazos', 'El rol de cada entidad en el proceso'],
    paraQueSirve: 'Para conducir la liberación de áreas de un proyecto sin retrasos.',
    fechasTexto: 'Miércoles 6 de enero, 13 de enero, 20 de enero, 27 de enero de 2027'
  },
  'saneamiento-fisico-legal-de-predios-diagnostico-tecnico-lega': {
    objetivo: 'Desarrollar capacidades para diagnosticar la situación física y legal de predios y orientar su saneamiento.',
    aprenderas: ['Cómo diagnosticar la situación física y legal de un predio', 'Cómo leer títulos y antecedentes registrales', 'Rutas de saneamiento según cada caso'],
    paraQueSirve: 'Para resolver contingencias prediales antes de que detengan una obra.',
    fechasTexto: 'Miércoles 3 de febrero, 10 de febrero, 17 de febrero, 24 de febrero de 2027'
  },
  'requerimientos-socioambientales-en-la-liberacion-de-areas-ex': {
    objetivo: 'Comprender los requerimientos socioambientales que exigen clientes y financiadores en la liberación de áreas.',
    aprenderas: ['Qué exigen el cliente y los contratos en la liberación de áreas', 'Los estándares socioambientales del Banco Mundial, BID e IFC', 'Cómo verificar el cumplimiento de esos requisitos'],
    paraQueSirve: 'Para cumplir lo que exigen financiadores y clientes en proyectos de infraestructura.',
    fechasTexto: 'Miércoles 3 de marzo, 10 de marzo, 17 de marzo, 24 de marzo de 2027'
  },
  'empadronamiento-y-diagnostico-socioeconomico-de-poblacion-af': {
    objetivo: 'Desarrollar capacidades para caracterizar a la población afectada por un proyecto con herramientas digitales.',
    aprenderas: ['Tipos de afectación y derechos de la población', 'Cómo diseñar y aplicar un empadronamiento con herramientas digitales', 'Cómo analizar y presentar el diagnóstico socioeconómico'],
    paraQueSirve: 'Para contar con información confiable sobre la población afectada.',
    fechasTexto: 'Miércoles 7 de abril, 14 de abril, 21 de abril, 28 de abril de 2027'
  },
  'reasentamiento-involuntario-y-pacri-planes-de-compensacion-b': {
    objetivo: 'Comprender los principios y estándares internacionales del reasentamiento involuntario y la compensación.',
    aprenderas: ['Principios y estándares del reasentamiento involuntario', 'Elegibilidad y compensaciones', 'Cómo restablecer los medios de vida de las familias'],
    paraQueSirve: 'Para gestionar reasentamientos que cumplan estándares internacionales.',
    fechasTexto: 'Miércoles 5 de mayo, 12 de mayo, 19 de mayo, 26 de mayo de 2027'
  },
  'negociacion-trato-directo-y-gestion-de-acuerdos-con-poblacio': {
    objetivo: 'Fortalecer capacidades de negociación con población afectada con enfoque social.',
    aprenderas: ['Cómo negociar con población afectada con enfoque social', 'Cómo conducir el trato directo y cerrar acuerdos', 'Cómo manejar casos complejos'],
    paraQueSirve: 'Para lograr acuerdos sostenibles y evitar conflictos en la liberación de áreas.',
    fechasTexto: 'Miércoles 2 de junio, 9 de junio, 16 de junio, 23 de junio de 2027'
  },
  'gestion-del-riesgo-de-desastres-ante-el-fenomeno-el-nino-pre': {
    objetivo: 'Comprender el Fenómeno El Niño, sus escenarios de riesgo y sus impactos socioambientales en el territorio.',
    aprenderas: ['Cómo funciona el Fenómeno El Niño y cómo leer los comunicados oficiales', 'Los procesos de la gestión del riesgo de desastres', 'Los impactos socioambientales en poblaciones vulnerables'],
    paraQueSirve: 'Para anticipar escenarios de riesgo en un territorio.',
    fechasTexto: 'Jueves 7 de enero, 14 de enero, 21 de enero, 28 de enero de 2027'
  },
  'planes-de-contingencia-y-sistemas-de-alerta-temprana-con-enf': {
    objetivo: 'Fortalecer la preparación de organizaciones y comunidades frente a emergencias con enfoque comunitario.',
    aprenderas: ['Qué debe tener un plan de contingencia', 'Cómo funcionan los sistemas de alerta temprana comunitarios', 'Cómo organizar roles, comunicaciones y simulacros'],
    paraQueSirve: 'Para preparar a una organización o comunidad antes de una emergencia.',
    fechasTexto: 'Jueves 4 de febrero, 11 de febrero, 18 de febrero, 25 de febrero de 2027'
  },
  'evaluacion-de-danos-y-analisis-de-necesidades-edan-y-empadro': {
    objetivo: 'Desarrollar capacidades para evaluar daños y necesidades y registrar a la población afectada.',
    aprenderas: ['La metodología de evaluación de daños y análisis de necesidades', 'Cómo registrar y empadronar a la población afectada', 'Herramientas digitales para el trabajo en campo'],
    paraQueSirve: 'Para priorizar la ayuda con información rápida y confiable.',
    fechasTexto: 'Jueves 4 de marzo, 11 de marzo, 18 de marzo, 1 de abril de 2027'
  },
  'gestion-integral-del-agua-y-soluciones-basadas-en-la-natural': {
    objetivo: 'Comprender cómo la gestión del agua y las soluciones basadas en la naturaleza reducen el riesgo de desastres.',
    aprenderas: ['La relación entre agua, cuencas y riesgo de desastres', 'La gestión integral de recursos hídricos', 'Las soluciones basadas en la naturaleza'],
    paraQueSirve: 'Para proponer medidas de reducción del riesgo que cuiden el agua y el territorio.',
    fechasTexto: 'Jueves 8 de abril, 15 de abril, 22 de abril, 29 de abril de 2027'
  },
  'gestion-de-la-asistencia-humanitaria-programas-sociales-y-fo': {
    objetivo: 'Fortalecer la gestión de la asistencia humanitaria y la focalización de apoyos con enfoque de derechos.',
    aprenderas: ['Principios y estándares de la asistencia humanitaria', 'Cómo operan los programas sociales en emergencias', 'Criterios de focalización'],
    paraQueSirve: 'Para organizar la ayuda de forma ordenada y con enfoque de derechos.',
    fechasTexto: 'Jueves 6 de mayo, 13 de mayo, 20 de mayo, 27 de mayo de 2027'
  },
  'reconstruccion-resiliente-post-desastre-y-recuperacion-de-me': {
    objetivo: 'Comprender los enfoques de reconstrucción resiliente y recuperación de medios de vida.',
    aprenderas: ['Enfoques de reconstrucción resiliente', 'Cómo recuperar los medios de vida', 'Financiamiento y articulación público-privada'],
    paraQueSirve: 'Para planificar la recuperación después de un desastre.',
    fechasTexto: 'Jueves 3 de junio, 10 de junio, 17 de junio, 24 de junio de 2027'
  },
  'diagnostico-asg-y-analisis-de-brechas-bajo-los-estandares-de': {
    objetivo: 'Comprender los criterios ASG que exigen clientes, bancos e inversionistas y cómo evaluar el desempeño de una empresa.',
    aprenderas: ['Qué criterios ASG piden clientes, bancos e inversionistas', 'Cómo diagnosticar el desempeño ASG de una empresa', 'Cómo identificar y priorizar brechas'],
    paraQueSirve: 'Para saber qué le falta a una empresa para cumplir y cómo cerrarlo.',
    fechasTexto: 'Sábados 9 de enero, 16 de enero, 23 de enero, 30 de enero de 2027'
  },
  'huella-de-carbono-organizacional-medicion-reduccion-y-recono': {
    objetivo: 'Desarrollar capacidades para medir, reducir y reportar la huella de carbono de una organización.',
    aprenderas: ['Conceptos y alcances de la huella de carbono', 'Cómo recolectar datos y calcular emisiones', 'Cómo reducirla y registrarla en Huella de Carbono Perú'],
    paraQueSirve: 'Para medir y gestionar las emisiones de una organización.',
    fechasTexto: 'Sábados 6 de febrero, 13 de febrero, 20 de febrero, 27 de febrero de 2027'
  },
  'huella-hidrica-y-gestion-eficiente-del-agua-en-la-empresa-is': {
    objetivo: 'Desarrollar capacidades para medir la huella hídrica y gestionar el agua de forma eficiente en la empresa.',
    aprenderas: ['Qué es la huella hídrica y cómo se mide', 'Cómo analizar el uso de agua en la empresa', 'Medidas de eficiencia y reúso'],
    paraQueSirve: 'Para reducir el consumo y el riesgo hídrico de una empresa.',
    fechasTexto: 'Sábados 6 de marzo, 13 de marzo, 20 de marzo, 27 de marzo de 2027'
  },
  'economia-circular-ecoeficiencia-y-gestion-de-residuos-ahorro': {
    objetivo: 'Comprender cómo la economía circular y la ecoeficiencia reducen costos y mejoran el desempeño ambiental.',
    aprenderas: ['Conceptos de economía circular y ecoeficiencia', 'Obligaciones en la gestión de residuos', 'Cómo calcular ahorros en energía, agua y materiales'],
    paraQueSirve: 'Para reducir costos y mejorar el desempeño ambiental de la empresa.',
    fechasTexto: 'Sábados 3 de abril, 10 de abril, 17 de abril, 24 de abril de 2027'
  },
  'cumplimiento-legal-ambiental-social-y-sst-matriz-de-requisit': {
    objetivo: 'Fortalecer la gestión del cumplimiento legal ambiental, social y de SST en empresas proveedoras.',
    aprenderas: ['Requisitos legales ambientales, sociales y de SST', 'Cómo organizar obligaciones y evidencias', 'Cómo mantener el cumplimiento al día'],
    paraQueSirve: 'Para que la empresa esté preparada ante auditorías, clientes y autoridades.',
    fechasTexto: 'Sábados 8 de mayo, 15 de mayo, 22 de mayo, 29 de mayo de 2027'
  },
  'homologacion-de-proveedores-y-auditorias-asg-politicas-evide': {
    objetivo: 'Preparar a las empresas proveedoras para los procesos de homologación y auditorías ASG de sus clientes.',
    aprenderas: ['Cómo funcionan los procesos de homologación de proveedores', 'Qué políticas y evidencias se revisan', 'Cómo prepararse para la auditoría'],
    paraQueSirve: 'Para que una empresa proveedora apruebe la homologación de sus clientes.',
    fechasTexto: 'Sábados 5 de junio, 12 de junio, 19 de junio, 26 de junio de 2027'
  }
};

/* Comun a todos los cursos (ver pagina 1 del PDF): dirigido a = el mismo del programa al que pertenece. */

var EMPATIC_PROGRAMA_BANNERS = {
  p1: 'images/programa-p1-social.jpg',
  p2: 'images/programa-p2-predial.jpg',
  p3: 'images/programa-p3-riesgo.jpg',
  p4: 'images/programa-p4-asg.jpg'
};

function empaticProgramaCardHtml(r) {
  var aliado = r.aliado ? ' · Aliado: ' + empaticEscapeHtml(r.aliado) : '';
  var idUpper = String(r.id || '').toUpperCase();
  var banner = EMPATIC_PROGRAMA_BANNERS[String(r.id || '').toLowerCase()];
  var imgTag = banner
    ? '<img class="academy-feature-img" src="' + banner + '" alt="' + empaticEscapeHtml(idUpper) + ' · ' + empaticEscapeHtml(r.nombre) + '" loading="lazy">'
    : '<div class="academy-feature-img academy-feature-img--fallback" aria-hidden="true"></div>';
  var detalle = EMPATIC_PROGRAMA_DETAIL[String(r.id || '').toLowerCase()] || {};
  var resumen = detalle.objetivoGeneral ? '<p class="academy-course-meta">' + empaticEscapeHtml(detalle.objetivoGeneral) + '</p>' : '';
  return (
    '<div class="academy-feature reveal-up" id="programa-' + empaticEscapeHtml(r.id) + '">' +
      imgTag +
      '<div class="academy-feature-content">' +
        '<h3>' + empaticEscapeHtml(idUpper) + ' · ' + empaticEscapeHtml(r.nombre) + '</h3>' +
        '<span class="academy-tag">' + empaticEscapeHtml(r.card_tag || idUpper) + '</span>' +
        resumen +
        '<p class="academy-course-meta">6 cursos · ' + empaticEscapeHtml(r.dia) + ' · ' + empaticEscapeHtml(r.horario) + aliado + '</p>' +
        '<p class="academy-course-price">' + empaticEscapeHtml(r.precio_contado) + ' al contado <small>o ' + empaticEscapeHtml(r.precio_cuotas) + '</small></p>' +
        '<div class="academy-feature-actions">' +
          '<a href="programa.html?id=' + encodeURIComponent(r.id) + '" class="btn btn-outline btn-sm">Conocer el programa</a>' +
          '<button type="button" class="btn btn-outline btn-sm academy-ver-cursos" data-programa="' + empaticEscapeHtml(r.id) + '">Ver sus 6 cursos</button>' +
          '<a href="' + empaticEscapeHtml(r.form_link || '#') + '" target="_blank" rel="noopener" class="btn btn-primary btn-sm">Matricúlate ya</a>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function empaticFormatFechaSheet(v) {
  var s = String(v || '');
  if (!/^\d{4}-\d{2}-\d{2}T/.test(s)) return s;
  var d = new Date(s);
  var dd = ('0' + d.getUTCDate()).slice(-2);
  var mm = ('0' + (d.getUTCMonth() + 1)).slice(-2);
  return dd + '/' + mm + '/' + d.getUTCFullYear();
}

function empaticCursoAcademyCardHtml(r) {
  var programaLabel = String(r.programa || '').toUpperCase();
  var texto = String(r.titulo || '').toLowerCase();
  return (
    '<div class="card academy-course-card" data-programa="' + empaticEscapeHtml(r.programa) + '" data-mes="' + empaticEscapeHtml(r.mes) + '" data-dia="' + empaticEscapeHtml(r.dia) + '" data-texto="' + empaticEscapeHtml(texto) + '">' +
      '<div class="academy-card-head">' +
        '<div class="icon-badge" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg></div>' +
        '<span class="academy-tag">' + empaticEscapeHtml(r.card_tag || '') + '</span>' +
      '</div>' +
      '<h3><a href="curso.html?slug=' + encodeURIComponent(r.slug || '') + '">' + empaticEscapeHtml(r.titulo) + '</a></h3>' +
      '<p class="academy-course-meta"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span>' + empaticEscapeHtml(programaLabel) + ' · Inicio ' + empaticEscapeHtml(empaticFormatFechaSheet(r.inicio)) + ' · ' + empaticEscapeHtml(r.horario) + '</span></p>' +
      '<p class="academy-course-price">' + empaticEscapeHtml(r.inversion) + ' <small>· ' + empaticEscapeHtml(r.precio_aliado) + ' aliados</small></p>' +
      '<div class="academy-feature-actions">' +
        '<a href="curso.html?slug=' + encodeURIComponent(r.slug || '') + '" class="btn btn-outline btn-sm">Ver curso</a>' +
        '<a href="' + empaticEscapeHtml(r.form_link || '#') + '" target="_blank" rel="noopener" class="btn btn-primary btn-sm">Matricúlate ya</a>' +
      '</div>' +
    '</div>'
  );
}

var EMPATIC_WORKSHOP_BANNERS = [
  { match: /ni[nñ]o/i, src: 'images/workshop-1-riesgo-nino.jpg' },
  { match: /asg|homologaci[oó]n|proveedor/i, src: 'images/workshop-2-asg-proveedores.jpg' },
  { match: /derechos humanos|debida diligencia/i, src: 'images/workshop-3-derechos-humanos.jpg' }
];

function empaticWorkshopBannerFor(titulo) {
  var t = String(titulo || '');
  for (var i = 0; i < EMPATIC_WORKSHOP_BANNERS.length; i++) {
    if (EMPATIC_WORKSHOP_BANNERS[i].match.test(t)) return EMPATIC_WORKSHOP_BANNERS[i].src;
  }
  return null;
}

function empaticWorkshopCardHtml(r) {
  var waHref = 'https://wa.me/51974131951?text=' + encodeURIComponent(r.whatsapp_mensaje || '');
  var banner = empaticWorkshopBannerFor(r.titulo);
  var imgTag = banner
    ? '<img class="academy-feature-img" src="' + banner + '" alt="' + empaticEscapeHtml(r.titulo) + '" loading="lazy">'
    : '<div class="academy-feature-img academy-feature-img--fallback" aria-hidden="true"></div>';
  return (
    '<div class="academy-feature reveal-up">' +
      imgTag +
      '<div class="academy-feature-content">' +
        '<h3>' + empaticEscapeHtml(r.titulo) + '</h3>' +
        '<span class="academy-tag">Workshop</span>' +
        '<p class="academy-course-meta">' + empaticEscapeHtml(r.descripcion) + '</p>' +
        '<p class="academy-course-meta"><strong>Tu equipo se lleva:</strong> ' + empaticEscapeHtml(r.llevas) + '</p>' +
        '<p class="academy-course-meta"><strong>Dirigido a:</strong> ' + empaticEscapeHtml(r.dirigido_a) + '</p>' +
        '<div class="academy-feature-actions">' +
          '<a href="' + waHref + '" target="_blank" rel="noopener" class="btn btn-outline btn-sm">Quiero más información</a>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

(function () {
  var tabsWrap = document.querySelector('.academy-tabs');
  if (!tabsWrap) return;

  var tabButtons = Array.prototype.slice.call(tabsWrap.querySelectorAll('.academy-tab-btn'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.academy-tab-panel'));

  function activatePanel(panelId) {
    tabButtons.forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-panel') === panelId);
    });
    panels.forEach(function (panel) {
      panel.classList.toggle('is-active', panel.id === panelId);
    });
  }

  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      activatePanel(btn.getAttribute('data-panel'));
    });
  });

  if (window.location.hash === '#cursos') {
    activatePanel('panel-cursos');
  }

  var programasGrid = document.getElementById('programasGrid');
  var cursosGrid = document.getElementById('cursosGrid');
  var workshopsGrid = document.getElementById('workshopsGrid');
  var cursosEmpty = document.getElementById('cursosEmpty');

  function wireVerCursosButtons() {
    Array.prototype.slice.call(document.querySelectorAll('.academy-ver-cursos')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        activatePanel('panel-cursos');
        var filtroPrograma = document.getElementById('filtroPrograma');
        if (filtroPrograma) {
          filtroPrograma.value = btn.getAttribute('data-programa');
          filtroPrograma.dispatchEvent(new Event('change'));
        }
      });
    });
  }

  function wireFilters() {
    var filtroPrograma = document.getElementById('filtroPrograma');
    var filtroMes = document.getElementById('filtroMes');
    var filtroDia = document.getElementById('filtroDia');
    var filtroPalabra = document.getElementById('filtroPalabra');
    var cursoCards = Array.prototype.slice.call(document.querySelectorAll('.academy-course-card'));

    function applyFilters() {
      var programa = filtroPrograma ? filtroPrograma.value : '';
      var mes = filtroMes ? filtroMes.value : '';
      var dia = filtroDia ? filtroDia.value : '';
      var palabra = filtroPalabra ? filtroPalabra.value.trim().toLowerCase() : '';
      var visibles = 0;

      cursoCards.forEach(function (card) {
        var matches = true;
        if (programa && card.getAttribute('data-programa') !== programa) matches = false;
        if (mes && card.getAttribute('data-mes') !== mes) matches = false;
        if (dia && card.getAttribute('data-dia') !== dia) matches = false;
        if (palabra && card.getAttribute('data-texto').indexOf(palabra) === -1) matches = false;
        card.style.display = matches ? '' : 'none';
        if (matches) visibles++;
      });

      if (cursosEmpty) cursosEmpty.style.display = visibles === 0 ? '' : 'none';
    }

    [filtroPrograma, filtroMes, filtroDia].forEach(function (el) {
      if (el) el.addEventListener('change', applyFilters);
    });
    if (filtroPalabra) filtroPalabra.addEventListener('input', applyFilters);
  }

  Promise.all([
    empaticFetchTipo('programas').catch(function (err) { console.error('No se pudieron cargar los programas:', err); return []; }),
    empaticFetchTipo('cursos').catch(function (err) { console.error('No se pudieron cargar los cursos:', err); return []; }),
    empaticFetchTipo('workshops').catch(function (err) { console.error('No se pudieron cargar los workshops:', err); return []; })
  ]).then(function (results) {
    var programas = results[0], cursos = results[1], workshops = results[2];
    if (programasGrid) programasGrid.innerHTML = programas.map(empaticProgramaCardHtml).join('');
    if (cursosGrid) cursosGrid.innerHTML = cursos.map(empaticCursoAcademyCardHtml).join('');
    if (workshopsGrid) workshopsGrid.innerHTML = workshops.map(empaticWorkshopCardHtml).join('');
    wireVerCursosButtons();
    wireFilters();
    empaticActivateScrollEffects(document);
  }).finally(function () {
    empaticHideLoadingOverlay();
  });
})();

