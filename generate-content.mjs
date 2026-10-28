// Genera paginas estaticas (casos de negocio, blog, podcast) a partir de las
// hojas de Google Sheets publicadas via el Apps Script "EMPATIC - API Datos".
// Uso: node generate-content.mjs
// Vuelve a correrlo cada vez que agreguen/editen una fila en los Sheets.

const API = 'https://script.google.com/macros/s/AKfycbzxBe8Z95x9_TJdUbGPFbxUXeimudgfjBas5UyoOqhc5T4u_2z6VlUgPAtA6C5PixQd/exec';

import { writeFileSync, readFileSync, existsSync } from 'node:fs';

function driveImageUrl(link) {
  if (!link) return '';
  const m = String(link).match(/\/d\/([a-zA-Z0-9_-]{10,})/) || String(link).match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (m) return `https://lh3.googleusercontent.com/d/${m[1]}=w1200`;
  return link;
}

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function fetchTipo(tipo) {
  const res = await fetch(`${API}?tipo=${tipo}`);
  const data = await res.json();
  return data
    .filter((r) => String(r.activo || '').toUpperCase() === 'SI')
    .sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));
}

const SVG_LINKEDIN = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7.5 10.5v6M7.5 7.5v.01M11.5 16.5v-4c0-1.5 1-2.4 2.3-2.4 1.3 0 2.2.9 2.2 2.4v4"/></svg>';
const SVG_SITIO = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 6 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-6-3.8-9S9.5 5.7 12 3Z"/></svg>';
const SVG_INSTAGRAM = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/></svg>';

function pageHead({ title, description, canonicalPath }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="referrer" content="no-referrer">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="icon" type="image/png" href="images/logo-empatic.png">
<link rel="stylesheet" href="styles.css?v=5">
<link rel="canonical" href="https://grupoempatic.com/${canonicalPath}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="EMPATIC">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="https://grupoempatic.com/${canonicalPath}">
<meta property="og:image" content="https://grupoempatic.com/images/logo-empatic.png">
<meta property="og:locale" content="es_PE">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="https://grupoempatic.com/images/logo-empatic.png">
</head>
<body>

<header class="nav">
  <div class="nav-inner">
    <a href="index.html" class="brand">
      <img class="brand-mark" src="images/logo-empatic.png" alt="" width="30" height="30">
      <span class="brand-word">EMPATIC</span>
    </a>
    <nav class="nav-links">
      <a href="index.html">Inicio</a>
      <a href="soluciones.html">Soluciones</a>
      <a href="negocios-sostenibles.html">Negocios Sostenibles</a>
      <a href="acciones-empaticas.html">Acciones Empáticas</a>
      <a href="novedades.html">Novedades</a>
      <a href="empatic-academy.html" class="nav-links-academy">Empatic Academy</a>
    </nav>
    <div class="nav-cta">
      <a href="empatic-academy.html" class="btn btn-sm">Empatic Academy</a>
      <button class="nav-toggle" id="navToggle" aria-label="Abrir menú"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>
`;
}

function pageFoot() {
  return `
<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-brand">
      <a href="index.html" class="brand">
        <img class="brand-mark" src="images/logo-empatic.png" alt="" width="30" height="30">
        <span class="brand-word">EMPATIC</span>
      </a>
      <p>Sostenibilidad aplicada para organizaciones más competitivas. Consultora en ASG e inteligencia territorial.</p>
      <div class="footer-social">
        <a href="#" aria-label="Sitio web">${SVG_SITIO}</a>
        <a href="https://www.linkedin.com/company/empatic-sostenibilidad/" aria-label="LinkedIn" target="_blank" rel="noopener">${SVG_LINKEDIN}</a>
        <a href="https://www.instagram.com/grupoempatic/" aria-label="Instagram" target="_blank" rel="noopener">${SVG_INSTAGRAM}</a>
      </div>
    </div>
    <div class="footer-col">
      <h4>Navegación</h4>
      <ul>
        <li><a href="index.html">Inicio</a></li>
        <li><a href="soluciones.html">Soluciones</a></li>
        <li><a href="negocios-sostenibles.html">Negocios Sostenibles</a></li>
        <li><a href="acciones-empaticas.html">Acciones Empáticas</a></li>
        <li><a href="novedades.html">Novedades</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Empresa</h4>
      <ul>
        <li><a href="contacto.html">Contacto</a></li>
        <li><a href="empatic-academy.html">Empatic Academy</a></li>
        <li><a href="privacidad.html">Privacidad</a></li>
        <li><a href="terminos.html">Términos y condiciones</a></li>
        <li><a href="libro-reclamaciones.html">Libro de Reclamaciones</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Contacto</h4>
      <ul>
        <li><a href="https://wa.me/51974131951" target="_blank" rel="noopener">+51 974 131 951</a></li>
        <li><a href="mailto:contacto@grupoempatic.com">contacto@grupoempatic.com</a></li>
        <li>Lima, Perú</li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">© 2026 EMPATIC. Todos los derechos reservados.</div>
</footer>

<script src="script.js?v=6"></script>
</body>
</html>
`;
}

function negocioPage(row) {
  const historia = String(row.historia || '').split('||').map((p) => `<p>${esc(p.trim())}</p>`).join('\n      ');
  const metrics = [
    [row.metrica1_valor, row.metrica1_label],
    [row.metrica2_valor, row.metrica2_label],
    [row.metrica3_valor, row.metrica3_label],
  ].filter(([v]) => v);
  const metricsHtml = metrics.length
    ? `<div class="case-block">
      <span class="eyebrow">📊 Indicadores clave de resultado</span>
      <div class="case-metrics">
        ${metrics.map(([v, l]) => `<div class="case-metric">
          <div class="num">${esc(v)}</div>
          <p>${esc(l)}</p>
        </div>`).join('\n        ')}
      </div>
    </div>`
    : '';

  const podcastHtml = row.podcast_titulo
    ? `<div class="case-block">
      <span class="eyebrow">🎙️ Conversación con el líder</span>
      <div class="podcast-banner">
        <div class="podcast-play" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <div>
          <h3>${esc(row.podcast_titulo)}</h3>
          <p>${esc(row.podcast_descripcion)}</p>
        </div>
      </div>
    </div>`
    : '';

  const title = `${row.nombre} | Casos de Éxito | EMPATIC`;
  const description = row.cita || row.titular;

  return pageHead({ title, description, canonicalPath: `caso-${row.slug}.html` }) + `
<section class="case-hero">
  <div class="container case-hero-inner">
    <div class="case-hero-copy">
      <a href="negocios-sostenibles.html" class="case-back-link">← Volver a la Red de Negocios</a>
      <span class="eyebrow">${esc(row.eyebrow)}</span>
      <h1>${esc(row.titular)}</h1>
      <p class="case-hero-quote">"${esc(row.cita)}"</p>
      <p class="case-hero-attribution">${esc(row.atribucion)}</p>
    </div>
    <aside class="case-sidebar">
      <div class="case-sidebar-logo" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </div>
      <h4>${esc(row.nombre)}</h4>
      <dl class="case-sidebar-facts">
        <div>
          <dt>Sector</dt>
          <dd>${esc(row.sector)}</dd>
        </div>
        <div>
          <dt>Región de impacto</dt>
          <dd>${esc(row.ubicacion)}</dd>
        </div>
      </dl>
      <div class="case-sidebar-links">
        <a href="${esc(row.sitio_web || '#')}" aria-label="Sitio web de ${esc(row.nombre)}">${SVG_SITIO}</a>
        <a href="${esc(row.linkedin || '#')}" aria-label="LinkedIn de ${esc(row.nombre)}">${SVG_LINKEDIN}</a>
        <a href="${esc(row.instagram || '#')}" aria-label="Instagram de ${esc(row.nombre)}">${SVG_INSTAGRAM}</a>
      </div>
    </aside>
  </div>
</section>

<section class="section section-light">
  <div class="container container-narrow">
    ${podcastHtml}

    <div class="case-block">
      <span class="eyebrow">📖 La historia de impacto</span>
      ${historia}
    </div>

    ${metricsHtml}
  </div>
</section>

<section class="section section-tint">
  <div class="container">
    <div class="section-head center">
      <span class="eyebrow">Sigue explorando</span>
      <h2>Otras historias recomendadas</h2>
    </div>
    <div class="grid-3">
      <a href="negocios-sostenibles.html" class="card case-recommended-item">
        <span class="article-card-tag">Ver todas</span>
        <h4>Red de Negocios Sostenibles</h4>
        <p>Conoce el resto de organizaciones y casos de éxito de la vitrina EMPATIC.</p>
      </a>
      <a href="negocios-sostenibles.html" class="card case-recommended-item">
        <span class="article-card-tag">Próximamente</span>
        <h4>Nuevos casos en camino</h4>
        <p>Seguimos sumando organizaciones a la Red de Negocios Sostenibles.</p>
      </a>
      <a href="negocios-sostenibles.html" class="card case-recommended-item">
        <span class="article-card-tag">Postula</span>
        <h4>¿Tu negocio aplica buenas prácticas?</h4>
        <p>Postula a la Red de Negocios Sostenibles y comparte tu caso.</p>
      </a>
    </div>
  </div>
</section>
` + pageFoot();
}

function articlePage(row, tipo) {
  const contenido = String(row.contenido || '').split('||').map((p) => `<p>${esc(p.trim())}</p>`).join('\n      ');
  const fecha = row.fecha ? new Date(row.fecha).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const tipoLabel = tipo === 'podcast' ? 'Podcast' : 'Blog';
  const title = `${row.titulo} | ${tipoLabel} | EMPATIC`;

  const audioHtml = tipo === 'podcast' && row.audio_url
    ? `<div class="case-block">
      <div class="podcast-banner">
        <div class="podcast-play" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <div>
          <h3>Escucha el episodio</h3>
          <p><a href="${esc(row.audio_url)}" target="_blank" rel="noopener">${esc(row.audio_url)}</a></p>
        </div>
      </div>
    </div>`
    : '';

  const portada = driveImageUrl(row.imagen_portada);
  const heroImg = portada
    ? `<img src="${esc(portada)}" alt="" referrerpolicy="no-referrer" style="width:100%;border-radius:var(--radius-lg);margin-bottom:24px;">`
    : '';

  return pageHead({ title, description: row.resumen, canonicalPath: `${tipo}-${row.slug}.html` }) + `
<section class="page-header">
  <div class="container">
    <span class="eyebrow">${esc(tipoLabel)} · ${esc(row.categoria)}</span>
    <h1>${esc(row.titulo)}</h1>
    <p>${esc(row.resumen)}</p>
  </div>
</section>

<section class="section section-light">
  <div class="container container-narrow">
    ${heroImg}
    ${audioHtml}
    <div class="case-block legal-content">
      ${contenido}
    </div>
    <p style="margin-top:32px;color:var(--ink-soft);font-size:0.9rem;">
      ${fecha ? `Publicado el ${esc(fecha)} · ` : ''}${esc(row.autor || 'EMPATIC')}
    </p>
    <a href="acciones-empaticas.html" class="case-back-link" style="display:inline-block;margin-top:24px;">← Volver a Acciones Empáticas</a>
  </div>
</section>
` + pageFoot();
}

function cardHtml(row, tipo) {
  const portada = driveImageUrl(row.imagen_portada);
  const style = portada ? ` style="background-image: url('${esc(portada)}');"` : '';
  return `<a href="${tipo}-${esc(row.slug)}.html" class="card case-recommended-item"${style}>
        <span class="article-card-tag article-card-tag--ready">${esc(tipo === 'podcast' ? 'Podcast' : 'Blog')} · ${esc(row.categoria)}</span>
        <h4>${esc(row.titulo)}</h4>
        <p>${esc(row.resumen)}</p>
      </a>`;
}

function bizCardHtml(row) {
  const portada = driveImageUrl(row.imagen_portada);
  const style = portada ? ` style="background-image: url('${esc(portada)}');"` : '';
  return `<a href="caso-${esc(row.slug)}.html" class="biz-card-mini biz-card-mini--photo"${style}>
            <div class="biz-card-top">
              <div class="biz-card-logo" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div>
              <span class="biz-card-tag">Caso destacado</span>
            </div>
            <span class="biz-card-sector">${esc(row.sector)}</span>
            <h4>${esc(row.nombre)}</h4>
            <p>${esc(row.resumen || row.cita)}</p>
          </a>`;
}

function replaceBetween(text, startMarker, endMarker, replacement) {
  const s = text.indexOf(startMarker);
  const e = text.indexOf(endMarker, s);
  if (s === -1 || e === -1) throw new Error(`Marcadores no encontrados: ${startMarker}`);
  return text.slice(0, s + startMarker.length) + replacement + text.slice(e);
}

async function main() {
  const [negocios, blog, podcast] = await Promise.all([
    fetchTipo('negocios'),
    fetchTipo('blog'),
    fetchTipo('podcast'),
  ]);

  for (const row of negocios) {
    writeFileSync(`caso-${row.slug}.html`, negocioPage(row));
    console.log('Generado: caso-' + row.slug + '.html');
  }
  for (const row of blog) {
    writeFileSync(`blog-${row.slug}.html`, articlePage(row, 'blog'));
    console.log('Generado: blog-' + row.slug + '.html');
  }
  for (const row of podcast) {
    writeFileSync(`podcast-${row.slug}.html`, articlePage(row, 'podcast'));
    console.log('Generado: podcast-' + row.slug + '.html');
  }

  // --- Actualiza las fichas reales (no las de "Proximamente") del carrusel ---
  if (negocios.length) {
    const negFile = 'negocios-sostenibles.html';
    let negHtml = readFileSync(negFile, 'utf-8');
    const cards = negocios.map(bizCardHtml).join('\n          ');
    const cardsHidden = negocios
      .map((row) => bizCardHtml(row).replace('<a href=', '<a aria-hidden="true" tabindex="-1" href='))
      .join('\n          ');

    const M_START = '<!-- NEGOCIOS_DYNAMIC_START -->';
    const M_END = '<!-- NEGOCIOS_DYNAMIC_END -->';
    const M_START_H = '<!-- NEGOCIOS_DYNAMIC_HIDDEN_START -->';
    const M_END_H = '<!-- NEGOCIOS_DYNAMIC_HIDDEN_END -->';

    const staticCard = `<a href="caso-agrovalle.html" class="biz-card-mini biz-card-mini--photo" style="background-image: url('images/negocio-agroindustria.jpg');">
            <div class="biz-card-top">
              <div class="biz-card-logo" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div>
              <span class="biz-card-tag">Caso destacado</span>
            </div>
            <span class="biz-card-sector">Agroindustria</span>
            <h4>AgroValle Perú</h4>
            <p>Certificó su cadena de café bajo estándares de comercio justo y trazabilidad territorial.</p>
          </a>`;
    const staticCardHidden = `<a href="caso-agrovalle.html" class="biz-card-mini biz-card-mini--photo" aria-hidden="true" tabindex="-1" style="background-image: url('images/negocio-agroindustria.jpg');">
            <div class="biz-card-top">
              <div class="biz-card-logo"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div>
              <span class="biz-card-tag">Caso destacado</span>
            </div>
            <span class="biz-card-sector">Agroindustria</span>
            <h4>AgroValle Perú</h4>
            <p>Certificó su cadena de café bajo estándares de comercio justo y trazabilidad territorial.</p>
          </a>`;

    if (negHtml.includes(M_START)) {
      negHtml = replaceBetween(negHtml, M_START, M_END, `\n          ${cards}\n          `);
      negHtml = replaceBetween(negHtml, M_START_H, M_END_H, `\n          ${cardsHidden}\n          `);
      writeFileSync(negFile, negHtml);
      console.log('Actualizado: ' + negFile);
    } else if (negHtml.includes(staticCard)) {
      // Primera corrida: envuelve el bloque dinamico con marcadores para futuras corridas.
      negHtml = negHtml.replace(staticCard, `${M_START}\n          ${cards}\n          ${M_END}`);
      negHtml = negHtml.replace(staticCardHidden, `${M_START_H}\n          ${cardsHidden}\n          ${M_END_H}`);
      writeFileSync(negFile, negHtml);
      console.log('Actualizado: ' + negFile);
    } else {
      console.log('Aviso: no se encontraron marcadores en ' + negFile + '; revisa el archivo manualmente.');
    }
  }

  // --- Actualiza la seccion de Blog y Podcast en Acciones Empaticas ---
  const aeFile = 'acciones-empaticas.html';
  let aeHtml = readFileSync(aeFile, 'utf-8');
  const blogCards = blog.map((r) => cardHtml(r, 'blog')).join('\n      ');
  const podcastCards = podcast.map((r) => cardHtml(r, 'podcast')).join('\n      ');
  const sectionMarkerStart = '<!-- BLOG_PODCAST_START -->';
  const sectionMarkerEnd = '<!-- BLOG_PODCAST_END -->';
  const newSection = `${sectionMarkerStart}
<section class="section section-light">
  <div class="container">
    <div class="section-head center">
      <span class="eyebrow">Blog y Podcast</span>
      <h2>Historias, aprendizajes y conversaciones</h2>
      <p>Contenido para profundizar en sostenibilidad, territorio e impacto social.</p>
    </div>
    <div class="grid-3">
      ${blogCards || '<p>Próximamente nuevos artículos.</p>'}
    </div>
    <div class="section-head center" style="margin-top:48px;">
      <h3 style="font-size: var(--fs-h3, 1.5rem);">Podcast</h3>
    </div>
    <div class="grid-3">
      ${podcastCards || '<p>Próximamente nuevos episodios.</p>'}
    </div>
  </div>
</section>
${sectionMarkerEnd}`;

  if (aeHtml.includes(sectionMarkerStart)) {
    aeHtml = replaceBetween(aeHtml, sectionMarkerStart, sectionMarkerEnd, newSection.slice(sectionMarkerStart.length, -sectionMarkerEnd.length));
  } else {
    aeHtml = aeHtml.replace('<section class="section section-light">\n  <div class="container">\n    <div class="cta-banner">', newSection + '\n\n<section class="section section-light">\n  <div class="container">\n    <div class="cta-banner">');
  }
  writeFileSync(aeFile, aeHtml);
  console.log('Actualizado: ' + aeFile);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
