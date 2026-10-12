/* Portfolio terminal simulations. Illustrative output, not executed shell commands.
 * When motion is reduced, all lines remain visible without any animation.
 */
(() => {
  'use strict';
  const panels = [...document.querySelectorAll('[data-featured-demo]')];
  if (!panels.length) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const states = panels.map(panel => {
    const command = panel.querySelector('[data-demo-command]');
    const toggle = panel.querySelector('[data-demo-toggle]');
    const lines = [...panel.querySelectorAll('.dk-result-line')];
    if (!command || !toggle || !lines.length) return null;
    const full = panel.dataset.demoFullCommand || command.textContent.trim();
    const state = { panel, command, toggle, lines, full, visible:false, paused:false, job:null, token:0 };

    const cancel = () => {
      state.token++;
      if (state.job !== null) clearTimeout(state.job);
      state.job = null;
    };
    const complete = () => {
      cancel();
      panel.classList.remove('is-animated');
      command.textContent = full;
      lines.forEach(line => line.classList.add('is-visible'));
    };
    const button = () => {
      toggle.setAttribute('aria-pressed', String(state.paused));
      toggle.setAttribute('aria-label', state.paused ? 'Play terminal animation' : 'Pause terminal animation');
      toggle.textContent = state.paused ? 'Play ▶' : 'Pause Ⅱ';
      panel.classList.toggle('is-paused', state.paused);
    };
    const later = (fn, wait, token) => {
      state.job = setTimeout(() => {
        state.job = null;
        if (token !== state.token || !state.visible || document.hidden || state.paused || reduceMotion.matches) return;
        fn();
      }, wait);
    };
    const start = () => {
      cancel();
      if (reduceMotion.matches) return complete();
      if (!state.visible || document.hidden || state.paused) return;
      panel.classList.add('is-animated');
      command.textContent = '';
      lines.forEach(line => line.classList.remove('is-visible'));
      const token = state.token;
      let i = 0;
      const type = () => {
        if (i < full.length) {
          command.textContent = full.slice(0, ++i);
          return later(type, 42, token);
        }
        let j = 0;
        const show = () => {
          if (j < lines.length) {
            lines[j++].classList.add('is-visible');
            return later(show, 600, token);
          }
          later(start, 5000, token);
        };
        later(show, 400, token);
      };
      later(type, 450, token);
    };
    state.sync = () => {
      if (reduceMotion.matches) return complete();
      if (state.paused || !state.visible || document.hidden) {
        cancel();
        // Show the complete output whenever the animation is inactive.
        panel.classList.remove('is-animated');
        command.textContent = full;
        lines.forEach(line => line.classList.add('is-visible'));
        return;
      }
      start();
    };
    toggle.addEventListener('click', () => { state.paused = !state.paused; button(); state.sync(); });
    button();
    complete();
    return state;
  }).filter(Boolean);

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const state = states.find(s => s.panel === entry.target);
        if (state) { state.visible = entry.isIntersecting; state.sync(); }
      });
    }, { threshold:0.12 });
    states.forEach(state => io.observe(state.panel));
  } else {
    states.forEach(state => { state.visible = true; state.sync(); });
  }
  document.addEventListener('visibilitychange', () => states.forEach(s => s.sync()));
  reduceMotion.addEventListener('change', () => states.forEach(s => s.sync()));
})();
