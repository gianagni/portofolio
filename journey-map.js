/* Original pirate-themed Leaflet journey, adapted for the October 2026 portfolio.
   One marker = Jakarta home base. The project buttons select a story, not a
   claimed geographic location for each project. */
(() => {
  'use strict';

  const container = document.getElementById('journey-map');
  const frame = document.querySelector('.project-journey .pj-map-frame');
  if (!container || !frame) return;

  const jakarta = [-6.2088, 106.8456];
  const projects = {
    flowprint: { title: 'Flowprint', tag: 'Developer tooling', anchor: '#work-flowprint' },
    lahena: { title: 'Lahena', tag: 'Career readiness', anchor: '#work-lahena' },
    ngmarket: { title: 'NG Market', tag: 'Digital commerce', anchor: '#work-ngmarket' },
    disclosekit: { title: 'DiscloseKit', tag: 'Responsible disclosure', anchor: '#work-disclosekit' }
  };

  const choices = Array.from(document.querySelectorAll('.project-journey [data-project]'));
  const title = frame.querySelector('[data-pj-selected-title]');
  const link = frame.querySelector('[data-pj-selected-link]');
  const pirate = frame.querySelector('.map-pirate-overlay');
  if (pirate) {
    pirate.addEventListener('error', () => { pirate.hidden = true; });
    if (pirate.complete && pirate.naturalWidth === 0) pirate.hidden = true;
  }

  let map = null;
  let marker = null;
  let selected = 'flowprint';

  function popupNode(project) {
    const card = document.createElement('div');
    card.className = 'pj-popup';
    const label = document.createElement('small');
    label.textContent = 'JAKARTA HOME BASE';
    const heading = document.createElement('strong');
    heading.textContent = project.title;
    const subtitle = document.createElement('div');
    subtitle.textContent = project.tag;
    const anchor = document.createElement('a');
    anchor.href = project.anchor;
    anchor.textContent = 'View featured work →';
    card.append(label, heading, subtitle, anchor);
    return card;
  }

  function select(key, openPopup = false) {
    const project = projects[key];
    if (!project) return;
    selected = key;
    choices.forEach(item => {
      const active = item.dataset.project === key;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    if (title) title.textContent = project.title;
    if (link) link.href = project.anchor;
    if (marker) {
      marker.setPopupContent(popupNode(project));
      if (openPopup) {
        if (map) map.panTo(jakarta, { animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches });
        marker.openPopup();
      }
    }
  }

  choices.forEach(item => item.addEventListener('click', () => select(item.dataset.project, true)));
  select(selected);

  if (typeof window.L !== 'object') {
    container.setAttribute('aria-label', 'Map unavailable offline. Jakarta is the project home base.');
    return;
  }

  function initialize() {
    if (map) return;
    const L = window.L;
    try {
      map = L.map(container, {
        center: jakarta,
        zoom: 5,
        minZoom: 4,
        maxZoom: 7,
        scrollWheelZoom: false,
        zoomControl: false,
        attributionControl: false
      });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 7,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      L.control.zoom({ position: 'topright' }).addTo(map);
      const markerIcon = L.divIcon({
        className: 'neo-marker neo-marker-current',
        html: '<div class="neo-marker-label neo-marker-label-current">JAKARTA</div><div class="neo-marker-pin neo-marker-pin-current"></div>',
        iconSize: [42, 42],
        iconAnchor: [21, 49],
        popupAnchor: [0, -52]
      });
      marker = L.marker(jakarta, { icon: markerIcon, title: 'Jakarta project base' }).addTo(map);
      marker.bindPopup(popupNode(projects[selected]));
      frame.classList.add('pj-map-ready');
      // Recalculate size after the section becomes visible.
      window.setTimeout(() => map.invalidateSize(), 150);
    } catch (error) {
      // Keep the illustrated offline fallback instead of leaving an empty panel.
      console.warn('Journey map could not initialize:', error);
      if (map) { map.remove(); map = null; }
      marker = null;
    }
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        initialize();
      }
    }, { rootMargin: '250px 0px' });
    observer.observe(frame);
  } else initialize();
})();
