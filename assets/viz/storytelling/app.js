(() => {
  for (const chart of document.querySelectorAll('.focus-chart')) {
    const captions = {
      city: 'City council · Total emissions fell 10%.',
      transport: 'Transport manager · Transport emissions rose 10% while the city total fell.'
    };
    const controls = chart.querySelectorAll('[data-audience]');
    for (const control of controls) {
      control.addEventListener('click', () => {
        chart.dataset.reader = control.dataset.audience;
        for (const button of controls) {
          button.setAttribute('aria-pressed', String(button === control));
        }
        chart.querySelector('figcaption').textContent = captions[chart.dataset.reader];
      });
    }
  }
  // A deliberate table-of-contents choice takes priority over viewport estimation.
  let selectedSection;
  document.querySelectorAll('.lesson-toc a').forEach(link => link.addEventListener('click', () => {
    selectedSection = document.getElementById(link.hash.slice(1));
  }));
  for (const event of ['wheel', 'touchmove']) {
    window.addEventListener(event, () => { selectedSection = null; }, {passive:true});
  }
  document.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) selectedSection = null;
  });
  document.querySelector('[data-present-toggle]')?.addEventListener('click', () => {
    if (document.body.classList.contains('is-presenting') || !selectedSection) return;
    const target = selectedSection;
    selectedSection = null;
    setTimeout(() => {
      if (document.body.classList.contains('is-presenting')) location.hash = target.id;
    }, 0);
  });
  // Animate a chapter only when the reader reaches it, including direct links.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        entry.target.classList.toggle('chapter-visible', entry.isIntersecting);
      }
    }, {threshold: 0.15});
    document.querySelectorAll('[data-layout="framework-opening"], [data-class="narrative-frameworks"] .lesson-cover').forEach(scene => observer.observe(scene));
  }
})();
