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
  wa.setAttribute('aria-label', 'Habla con un consultor por WhatsApp');
  wa.innerHTML =
    '<span class="wa-float-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2Zm5.4 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1-1.3-1-2.5s.6-1.8.9-2.1c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.4.2.5.7 1.7.8 1.8.1.1.1.3 0 .5-.1.2-.1.3-.3.4-.1.2-.3.3-.4.5-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.5 1.5.3.1.5.1.7-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1l1.6.8c.2.1.4.2.4.3.1.2.1.7-.1 1.2Z"/></svg></span>' +
    '<span class="wa-float-text">Habla con un consultor</span>';
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
var EMPATIC_API = 'https://script.google.com/macros/s/AKfycbzxBe8Z95x9_TJdUbGPFbxUXeimudgfjBas5UyoOqhc5T4u_2z6VlUgPAtA6C5PixQd/exec';
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
var PODCAST_PAGE_SIZE = 2;
var PODCAST_AUTOPLAY_MS = 8000;
var ARTICULOS_PAGE_SIZE = 3;
var ACTIVIDADES_PAGE_SIZE = 3;
var ACTIVIDADES_AUTOPLAY_MS = 8000;

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
    return;
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

  nextBtn.addEventListener('click', function () { goNext(); resetAutoplay(); });
  prevBtn.addEventListener('click', function () { goPrev(); resetAutoplay(); });

  update();
  resetAutoplay();
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
  return (
    '<a class="podcast-card" href="' + href + '">' +
      '<div class="podcast-card-media"' + mediaAttr + ' aria-hidden="true"></div>' +
      '<div class="podcast-card-body">' +
        '<span class="article-card-tag article-card-tag--ready">' + empaticEscapeHtml(r.episodio) + '</span>' +
        '<h3>' + empaticEscapeHtml(r.titulo) + '</h3>' +
        '<p class="podcast-card-guest">' + empaticEscapeHtml(r.invitado) + '</p>' +
        '<p class="podcast-card-desc">' + empaticEscapeHtml(r.descripcion) + '</p>' +
        '<span class="podcast-card-cta">Ver episodio completo →</span>' +
      '</div>' +
    '</a>'
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
        '<p class="article-card-desc">' + empaticEscapeHtml(r.descripcion) + '</p>' +
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
  var boton = r.texto_boton || ACTIVIDAD_BOTON_DEFAULT[String(r.tipo_actividad || '').toLowerCase()] || 'Ver Detalles';
  var href = 'actividad.html?slug=' + encodeURIComponent(empaticItemSlug([r.tipo_actividad, r.titulo]));
  return (
    '<a class="event-item" href="' + href + '"' + attr + '>' +
      '<span class="event-item-tag">' + empaticEscapeHtml(r.tipo_actividad) + '</span>' +
      '<span class="event-item-title">' + empaticEscapeHtml(r.titulo) + '</span>' +
      '<span class="event-item-cta">' + empaticEscapeHtml(boton) + ' →</span>' +
    '</a>'
  );
}

(function () {
  var track = document.getElementById('podcastTrack');
  var nextBtn = document.getElementById('podcastNextBtn');
  var prevBtn = document.getElementById('podcastPrevBtn');
  if (!track || !nextBtn || !prevBtn) return;

  empaticFetchTipo('podcast').then(function (rows) {
    if (!rows.length) {
      track.closest('.novedades-carousel-wrap').style.display = 'none';
      return;
    }
    var pages = empaticBuildCircularPages(rows, PODCAST_PAGE_SIZE);
    var pagesHtml = pages.map(function (pageItems) {
      return '<div class="novedades-page podcast-grid">' + pageItems.map(empaticPodcastCardHtml).join('') + '</div>';
    }).join('');
    track.innerHTML = pagesHtml;
    empaticApplyBgUrls(track);
    initNovedadesCarousel(track, nextBtn, prevBtn, { circular: true, autoplayMs: PODCAST_AUTOPLAY_MS });
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
  if (!grid) return;

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
    return '<a href="caso-' + encodeURIComponent(r.slug) + '.html" class="' + cls + '"' + bgAttr + hiddenAttrs + '>' + inner + '</a>';
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

