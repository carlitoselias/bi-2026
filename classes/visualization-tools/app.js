/* Dashboard conceptual de Clase 04: pausa manual y fuera de pantalla. */
(() => {
  document.querySelectorAll('[data-dashboard-cover]').forEach(host => {
    const button=host.querySelector('[data-dashboard-toggle]');
    if(!button)return;
    let visible=false;
    const sync=()=>host.classList.toggle('is-offscreen',!visible || document.hidden);
    button.hidden=false;
    button.addEventListener('click',()=>{
      const paused=host.classList.toggle('is-user-paused');
      button.setAttribute('aria-pressed',String(paused));
      button.setAttribute('aria-label',paused?'Resume animation':'Pause animation');
    });
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.1}).observe(host);
    document.addEventListener('visibilitychange',sync);
    sync();
  });
})();
