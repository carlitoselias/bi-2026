(() => {
  const figure=document.querySelector('.anscombe-cover');if(!figure)return;
  const sets=[...figure.querySelectorAll('[data-anscombe-set]')],buttons=[...figure.querySelectorAll('[data-set]')],toggle=figure.querySelector('[data-animate]'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let current=0,timer=0,inView=false,enabled=!reduced.matches;
  function show(i){current=i;sets.forEach((g,n)=>g.toggleAttribute('hidden',n!==i));buttons.forEach((b,n)=>b.setAttribute('aria-pressed',String(n===i)));figure.querySelector('[data-set-label]').textContent=['I','II','III','IV'][i]+' / IV';}
  function schedule(){clearInterval(timer);timer=0;toggle.textContent=enabled?'Pause':'Play';toggle.disabled=reduced.matches;toggle.title=reduced.matches?'Automatic playback is off for reduced motion. Choose I, II, III or IV.':'';if(enabled&&inView&&!document.hidden&&!reduced.matches)timer=setInterval(()=>show((current+1)%4),3500);}
  buttons.forEach(b=>b.onclick=()=>{enabled=false;show(+b.dataset.set);schedule();});toggle.onclick=()=>{enabled=!enabled;schedule();};
  new IntersectionObserver(e=>{inView=e[0].isIntersecting;schedule();},{threshold:.2}).observe(figure);
  document.addEventListener('visibilitychange',schedule);reduced.addEventListener('change',()=>{enabled=!reduced.matches;schedule();});addEventListener('pagehide',()=>clearInterval(timer));addEventListener('pageshow',schedule);addEventListener('beforeprint',()=>clearInterval(timer));addEventListener('afterprint',schedule);show(0);schedule();
})();
