(() => {
  const body = document.body;

  const anscombe = document.querySelector('.anscombe-cover');
  if(anscombe) {
    const sets = [...anscombe.querySelectorAll('[data-anscombe-set]')];
    const label = anscombe.querySelector('[data-anscombe-label]');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let current = 0, timer = null, inView = true;
    const roman = ['I','II','III','IV'];
    function advance() {
      sets[current].classList.remove('is-active');
      current = (current + 1) % sets.length;
      sets[current].classList.add('is-active');
      label.textContent = `${roman[current]} / IV`;
    }
    function schedule() {
      clearInterval(timer); timer = null;
      if(!reducedMotion.matches && !document.hidden && inView) timer = setInterval(advance,3500);
    }
    reducedMotion.addEventListener('change',schedule);
    document.addEventListener('visibilitychange',schedule);
    window.addEventListener('pagehide',()=>clearInterval(timer));
    window.addEventListener('pageshow',schedule);
    if('IntersectionObserver' in window) new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;schedule();}).observe(anscombe);
    window.addEventListener('beforeprint',()=>clearInterval(timer));
    window.addEventListener('afterprint',schedule);
    schedule();
  }

  const historyItems = [...document.querySelectorAll('.history-item')];
  if(historyItems.length && typeof HTMLDialogElement !== 'undefined') {
    const viewer = document.createElement('dialog');
    viewer.className = 'history-viewer';
    viewer.setAttribute('aria-labelledby','history-viewer-title');
    viewer.innerHTML = `<div class="history-toolbar"><span data-history-position></span><div class="history-controls"><button type="button" data-history-prev aria-label="Previous image">←</button><button type="button" data-history-next aria-label="Next image">→</button><button type="button" data-history-close>Close ×</button></div></div><img class="history-large" alt=""><div class="history-description"><div><h2 id="history-viewer-title"></h2><a class="history-original" target="_blank" rel="noopener">Open full image ↗</a></div><div data-history-copy></div></div>`;
    document.body.append(viewer);
    let current = 0;
    let opener;
    const previousImage = viewer.querySelector('[data-history-prev]');
    const nextImage = viewer.querySelector('[data-history-next]');
    const close = viewer.querySelector('[data-history-close]');
    function showHistory(index) {
      current = index;
      const item = historyItems[current];
      const link = item.querySelector('.history-open');
      const image = item.querySelector('img');
      viewer.querySelector('.history-large').src = link.href;
      viewer.querySelector('.history-large').alt = image.alt;
      viewer.querySelector('h2').textContent = image.alt;
      viewer.querySelector('[data-history-position]').textContent = `${item.querySelector('.column-kicker').textContent} · ${current+1} / ${historyItems.length}`;
      viewer.querySelector('.history-original').href = link.href;
      viewer.querySelector('.history-original').textContent = 'Open full image ↗';
      viewer.querySelector('[data-history-copy]').replaceChildren(item.querySelector('.history-caption>div').cloneNode(true));
      previousImage.disabled = current === 0;
      nextImage.disabled = current === historyItems.length-1;
      viewer.scrollTop = 0;
    }
    historyItems.forEach((item,index)=>{
      item.querySelector('.history-caption').hidden = true;
      const link = item.querySelector('.history-open');
      link.setAttribute('aria-haspopup','dialog');
      link.addEventListener('click',event=>{
        if(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();opener=link;showHistory(index);viewer.showModal();close.focus();
      });
    });
    previousImage.addEventListener('click',()=>showHistory(Math.max(0,current-1)));
    nextImage.addEventListener('click',()=>showHistory(Math.min(historyItems.length-1,current+1)));
    close.addEventListener('click',()=>viewer.close());
    viewer.addEventListener('close',()=>opener?.focus({preventScroll:true}));
    viewer.addEventListener('keydown',event=>{
      if(event.key==='ArrowLeft' || event.key==='ArrowRight') {
        event.preventDefault();event.stopPropagation();
        showHistory(Math.max(0,Math.min(historyItems.length-1,current+(event.key==='ArrowRight'?1:-1))));
      }
    });
  }

  const presentationToggle = document.querySelector('[data-present-toggle]');
  const sections = [...document.querySelectorAll('[data-scene]')];
  const navigation = document.querySelector('.scene-navigation');
  const progress = document.querySelector('.scene-progress');
  const previous = document.querySelector('[data-previous]');
  const next = document.querySelector('[data-next]');
  const params = new URLSearchParams(location.search);
  let mode = params.get('modo') === 'presentar' ? 'present' : 'explore';
  let scene = Math.max(0,sections.findIndex(s=>`#${s.id}` === location.hash));
  const printState = new Map();
  const sceneActions = document.createElement('span');
  sceneActions.className='scene-actions';
  sceneActions.hidden=true;
  if(navigation && document.querySelector('.scene-resource')) progress.after(sceneActions);

  function updateUrl() {
    try {
      const url = new URL(location.href);
      if(mode === 'present')url.searchParams.set('modo','presentar'); else url.searchParams.delete('modo');
      if(sections.length)url.hash=sections[scene].id;
      history.replaceState(null,'',url);
    } catch { /* File URLs can limit History API; reading and controls still work. */ }
  }
  function render({move = false} = {}) {
    body.classList.toggle('is-presenting',mode === 'present');
    if(presentationToggle) {
      presentationToggle.setAttribute('aria-checked',String(mode === 'present'));
      presentationToggle.querySelector('[data-present-state]').textContent = mode === 'present' ? 'ON' : 'OFF';
    }
    sections.forEach((section,index)=>{section.hidden=mode==='present' && index!==scene;});
    if(navigation) {
      navigation.hidden=mode!=='present';
      progress.querySelector('[data-scene-current]').textContent=String(scene+1).padStart(2,'0');
      progress.setAttribute('aria-label',`Slide ${scene+1} of ${sections.length}`);
      previous.disabled=scene===0; next.disabled=scene===sections.length-1;
      const resource=sections[scene]?.querySelector('.scene-resource');
      sceneActions.replaceChildren(...(resource ? [resource.cloneNode(true)] : []));
      sceneActions.hidden=!resource;
    }
    if(move) {
      if(mode==='present') window.scrollTo({top:0,behavior:'auto'});
      else {
        const target = sections.length ? sections[scene] : document.querySelector('.publication');
        target.scrollIntoView({block:'start',behavior:'auto'});
      }
    }
  }
  function visibleScene() {
    const viewportBottom = window.innerHeight;
    const controls = document.querySelector('[data-site-controls]');
    const viewportTop = Math.min(viewportBottom,Math.max(0,controls?.getBoundingClientRect().bottom || 0));
    const viewportCenter = (viewportTop + viewportBottom) / 2;
    let best = scene, mostVisible = -1, nearestCenter = Infinity;
    sections.forEach((section,index)=>{
      const bounds = section.getBoundingClientRect();
      if(bounds.height <= 0)return;
      const visible = Math.max(0,Math.min(bounds.bottom,viewportBottom)-Math.max(bounds.top,viewportTop));
      const distance = Math.abs((bounds.top+bounds.bottom)/2-viewportCenter);
      if(visible > mostVisible || (visible === mostVisible && distance < nearestCenter)) {
        best=index;mostVisible=visible;nearestCenter=distance;
      }
    });
    return best;
  }
  function setMode(value) {
    if(value===mode)return;
    // Read the explored layout before presentation hides the other scenes.
    if(mode==='explore' && value==='present' && sections.length)scene=visibleScene();
    mode=value;render({move:true});updateUrl();
  }
  function setScene(index) {scene=Math.max(0,Math.min(sections.length-1,index));render({move:true});updateUrl();}
  if(!sections.length) mode='explore';
  if(presentationToggle) {
    presentationToggle.hidden=!sections.length;
    presentationToggle.addEventListener('click',()=>setMode(mode === 'present' ? 'explore' : 'present'));
  }
  if(sections.length) {
    document.querySelectorAll('.lesson-toc a').forEach(link=>link.addEventListener('click',()=>{
      const index=sections.findIndex(s=>`#${s.id}`===link.getAttribute('href'));
      if(index>=0)scene=index;
      link.closest('details').open=false;
    }));
    previous.addEventListener('click',()=>setScene(scene-1));
    next.addEventListener('click',()=>setScene(scene+1));
    document.addEventListener('keydown',event=>{
      if(document.querySelector('dialog[open]')||mode!=='present'||event.altKey||event.ctrlKey||event.metaKey||event.target.closest('input,textarea,select,[contenteditable="true"]'))return;
      if(event.key==='Home'){event.preventDefault();setScene(0);return;}
      if(event.key==='End'){event.preventDefault();setScene(sections.length-1);return;}
      if(['ArrowRight','ArrowLeft'].includes(event.key)){event.preventDefault();setScene(scene+(event.key==='ArrowRight'?1:-1));}
    });
    window.addEventListener('hashchange',()=>{const index=sections.findIndex(s=>`#${s.id}`===location.hash);if(index>=0){scene=index;render({move:true});}});
  }
  function preparePrint() {
    document.querySelectorAll('details').forEach(el=>{
      if(!printState.has(el)) printState.set(el,{open:el.open,hidden:el.hidden});
      el.hidden=false; el.open=true;
    });
    document.querySelectorAll('img[loading="lazy"]').forEach(img=>{img.loading='eager';});
    window.VizPrint?.prepare();
  }
  function restorePrint() {
    printState.forEach((state,el)=>{el.open=state.open;el.hidden=state.hidden;});
    printState.clear();
  }
  const exportButton = document.querySelector('[data-export-pdf]');
  if(exportButton) {
    exportButton.hidden=false;
    exportButton.addEventListener('click',async()=>{
      preparePrint();
      await document.fonts.ready;
      await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));
      await window.VizPrint?.ready;
      window.VizPrint?.prepare();
      window.print();
    });
  }
  window.addEventListener('beforeprint',preparePrint);
  window.addEventListener('afterprint',restorePrint);
  render();
})();
