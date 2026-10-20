/* Shared preference only. No lesson answers or personal data are stored. */
(() => {
  const key='bi-2026-theme',root=document.documentElement,system=matchMedia('(prefers-color-scheme: dark)');
  const valid=v=>['light','dark'].includes(v);
  let preference=null;
  try { preference=localStorage.getItem(key); } catch {}
  if(!valid(preference))try { preference=sessionStorage.getItem(key); } catch {}
  // A URL preference carries the choice between local pages if storage is blocked.
  const carried=new URLSearchParams(location.search).get('theme');
  if(valid(carried))preference=carried;
  if(!valid(preference))preference=null;
  function render(){const theme=preference||(system.matches?'dark':'light');root.dataset.theme=theme;root.style.colorScheme=theme;document.querySelectorAll('[data-theme-toggle]').forEach(b=>{b.hidden=false;b.setAttribute('aria-checked',String(theme==='dark'));b.querySelector('[data-theme-state]').textContent=theme==='dark'?'ON':'OFF';});}
  render();system.addEventListener('change',()=>{if(!preference)render();});
  addEventListener('storage',e=>{if(e.key===key||e.key===null){preference=valid(e.newValue)?e.newValue:null;render();}});
  document.addEventListener('DOMContentLoaded',()=>{
    render();document.querySelectorAll('[data-theme-toggle]').forEach(b=>b.addEventListener('click',()=>{preference=root.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem(key,preference);}catch{}try{sessionStorage.setItem(key,preference);}catch{}const url=new URL(location.href);if(url.searchParams.has('theme')){url.searchParams.set('theme',preference);try{history.replaceState(null,'',url);}catch{}}render();document.dispatchEvent(new Event('themechange'));}));
    document.querySelectorAll('[data-fullscreen-toggle]').forEach(b=>b.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{}}));
    document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a||!preference||a.getAttribute('href').startsWith('#'))return;const url=new URL(a.href);if(url.origin===location.origin&&/\.html$/.test(url.pathname)){url.searchParams.set('theme',preference);a.href=url.href;}});
  });
})();
