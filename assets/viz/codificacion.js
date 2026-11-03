/* Small, local demonstrations. No data service or generated analysis. */
(() => {
  const ns='http://www.w3.org/2000/svg';
  const text=(x,y,value,attrs={})=>{const el=document.createElementNS(ns,'text');Object.entries({x,y,...attrs}).forEach(([k,v])=>el.setAttribute(k,v));el.textContent=value;return el;};
  const elem=(tag,attrs)=>{const el=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));return el;};
  const rows=[{name:'North',value:40,total:50},{name:'South',value:60,total:100},{name:'Central',value:30,total:40},{name:'Coast',value:50,total:80}];
  document.querySelectorAll('[data-encoding-demo]').forEach(demo=>{
    const type=demo.dataset.encodingDemo, output=demo.querySelector('[data-demo-output]'), status=demo.querySelector('[data-demo-status]');
    let mode='base';
    const draw=()=>{
      const svg=output.querySelector('svg'), plot=svg.querySelector('[data-plot]');
      if(!plot)return;
      let accessibleDescription='';
      [...svg.children].filter(el=>el!==plot).forEach(el=>el.remove());
      plot.replaceChildren();
      if(['sort','change','filter','link'].includes(type)){
        const percent=type==='change'&&mode==='percent';
        let filterDescription='All branches';
        let values=rows.map(r=>({...r,n:percent?100*r.value/r.total:r.value}));
        if(type==='sort'&&mode==='sorted')values.sort((a,b)=>b.n-a.n);
        if(type==='filter'){
          const control=demo.querySelector('select'), choice=control.value;
          const minimum=Math.min(...rows.map(r=>r.value)), maximum=Math.max(...rows.map(r=>r.value));
          const conditions={base:()=>true,minimum:r=>r.n===minimum,maximum:r=>r.n===maximum,'at-most-30':r=>r.n<=30,'at-least-30':r=>r.n>=30};
          values=values.filter(conditions[choice]);
          filterDescription={base:'All branches',minimum:`Minimum: ${minimum}`,maximum:`Maximum: ${maximum}`,'at-most-30':'At most 30','at-least-30':'At least 30'}[choice];
          control.dataset.filterActive=String(choice!=='base');
        }
        values.forEach((r,i)=>{
          const y=45+i*47, selected=type==='link'&&mode===r.name;
          plot.append(text(12,y+17,r.name));
          plot.append(elem('rect',{x:100,y,width:r.n*3,height:27,fill:selected?'var(--viz-focus)':(type==='link'?'var(--viz-context)':'var(--ink)'),opacity:'1',stroke:selected?'var(--ink)':'none','stroke-width':selected?'2':'0'}));
          plot.append(text(110+r.n*3,y+20,`${Number(r.n.toFixed(1)).toLocaleString('en-GB')}${percent?' %':''}`));
        });
        plot.append(elem('path',{d:'M100 30V245H400',class:'axis'}));
        for(const v of [0,50,100])plot.append(text(100+v*3,267,String(v),{'text-anchor':'middle'}));
        plot.append(text(250,295,percent?'Completion (%)':'Resolved requests',{'text-anchor':'middle'}));
        if(type==='sort')status.textContent=mode==='sorted'?'Sorted by value: South, Coast, North, Central. Values do not change.':'Initial order: North, South, Central, Coast.';
        if(type==='change')status.textContent=percent?'North 80 %, Central 75 %, Coast 62.5 %, South 60 %. The variable changes; the branches stay the same.':'South resolves more requests by count. This does not imply a higher completion rate.';
        if(type==='filter')status.textContent=`${filterDescription}. ${values.length} of ${rows.length} branches visible.`;
        if(type==='link'){
          demo.querySelectorAll('tbody tr').forEach(tr=>{const active=mode===tr.dataset.sede;tr.style.background=active?'var(--viz-focus)':'';tr.style.color=active?'var(--viz-on-focus)':'';tr.style.fontWeight=active?'700':'';tr.setAttribute('aria-selected',String(active));});
          accessibleDescription=mode==='base'?'All branches are visible.':`${mode} selected in the chart and table.`;
        }
      }
      if(type==='navigate'){
        const zoom=Number(demo.querySelector('input').value), center=50, half=50/zoom;
        const lo=Math.max(0,Math.min(100-2*half,center-half)), hi=lo+2*half;
        const data=Array.from({length:21},(_,i)=>({x:i*5,y:22+(i*17)%65}));
        const shown=data.filter(p=>p.x>=lo&&p.x<=hi);
        plot.append(elem('path',{d:'M45 25V225H455',class:'axis'}));
        for(const v of [0,50,100])plot.append(text(35,225-v*1.8,String(v),{'text-anchor':'end'}));
        shown.forEach(p=>plot.append(elem('circle',{cx:45+(p.x-lo)/(hi-lo)*410,cy:225-p.y*1.8,r:5,class:'other'})));
        for(const v of [lo,(lo+hi)/2,hi])plot.append(text(45+(v-lo)/(hi-lo)*410,250,v.toLocaleString('en-GB', {maximumFractionDigits:2}),{'text-anchor':'middle'}));
        plot.append(text(250,280,'Record day',{'text-anchor':'middle'}));
        plot.append(text(48,15,'Quantity'));
        accessibleDescription=`Horizontal window: days ${lo.toLocaleString('en-GB', {maximumFractionDigits:2})}–${hi.toLocaleString('en-GB', {maximumFractionDigits:2})}. ${shown.length} of 21 observations visible; fixed vertical scale from 0 to 100.`;
      }
      const accessible=plot.textContent+' · '+(accessibleDescription||status?.textContent||'');
      svg.setAttribute('aria-label',accessible);
    };
    demo.querySelectorAll('button[data-choice]').forEach(button=>button.addEventListener('click',()=>{
      mode=button.dataset.choice;
      demo.querySelectorAll('button[data-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      draw();
    }));
    demo.querySelectorAll('input,select').forEach(control=>control.addEventListener('input',draw));
    draw();
  });
})();

// Load only the selected external example; closing the viewer stops its animation.
(() => {
  const gallery = document.querySelector('[data-chart-gallery]');
  if (!gallery || typeof HTMLDialogElement === 'undefined') return;
  const examples = [...gallery.querySelectorAll('[data-chart-embed]')];
  const viewer = document.createElement('dialog');
  viewer.className = 'chart-viewer';
  viewer.setAttribute('aria-labelledby', 'chart-viewer-title');
  viewer.innerHTML = `<header class="chart-viewer-toolbar">
    <div><span class="chart-viewer-position" data-chart-position></span><h2 id="chart-viewer-title"></h2></div>
    <div class="chart-viewer-controls">
      <button type="button" data-chart-prev aria-label="Previous example">←</button>
      <button type="button" data-chart-next aria-label="Next example">→</button>
      <button type="button" data-chart-close>Close ×</button>
    </div>
  </header>
  <div class="chart-viewer-stage" data-chart-stage></div>
  <footer class="chart-viewer-footer"><span data-chart-credit></span><a data-chart-original target="_blank" rel="noopener noreferrer">Open original ↗</a></footer>`;
  document.body.append(viewer);
  const stage = viewer.querySelector('[data-chart-stage]');
  const close = viewer.querySelector('[data-chart-close]');
  const previous = viewer.querySelector('[data-chart-prev]');
  const next = viewer.querySelector('[data-chart-next]');
  let current = 0;
  let opener;

  function show(index) {
    current = Math.max(0, Math.min(examples.length - 1, index));
    const example = examples[current];
    const title = example.dataset.chartTitle;
    viewer.querySelector('#chart-viewer-title').textContent = title;
    viewer.querySelector('[data-chart-position]').textContent = `${current + 1} / ${examples.length}`;
    viewer.querySelector('[data-chart-credit]').textContent = example.dataset.chartCredit;
    viewer.querySelector('[data-chart-original]').href = example.href;
    previous.disabled = current === 0;
    next.disabled = current === examples.length - 1;

    const frame = document.createElement('iframe');
    frame.title = `Interactive chart: ${title}`;
    frame.src = example.dataset.chartEmbed;
    frame.allow = 'fullscreen';
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    stage.replaceChildren(frame);
  }

  examples.forEach((example, index) => {
    example.setAttribute('aria-haspopup', 'dialog');
    example.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = example;
      viewer.showModal();
      document.body.classList.add('chart-viewer-open');
      show(index);
      close.focus();
    });
  });
  previous.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  close.addEventListener('click', () => viewer.close());
  viewer.addEventListener('close', () => {
    stage.replaceChildren();
    document.body.classList.remove('chart-viewer-open');
    opener?.focus({preventScroll: true});
  });
  window.addEventListener('beforeprint', () => { if (viewer.open) viewer.close(); });
})();

// Decorative cover: pause outside the viewport, in background tabs, and for print.
(() => {
  const visual = document.querySelector('[data-cover-motion]');
  if (!visual) return;
  const toggle = visual.querySelector('[data-cover-motion-toggle]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let inView = false, userPaused = false, printing = false, pageActive = true;

  function sync() {
    const enabled = !reducedMotion.matches;
    visual.classList.toggle('is-enhanced', enabled);
    visual.classList.toggle('is-running', enabled && inView && !document.hidden && !userPaused && !printing && pageActive);
    visual.classList.toggle('is-user-paused', userPaused);
    toggle.hidden = !enabled;
    toggle.setAttribute('aria-label', userPaused ? 'Resume animation' : 'Pause animation');
  }

  toggle.addEventListener('click', () => { userPaused = !userPaused; sync(); });
  reducedMotion.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => { pageActive = false; sync(); });
  window.addEventListener('pageshow', () => { pageActive = true; sync(); });
  window.addEventListener('beforeprint', () => { printing = true; sync(); });
  window.addEventListener('afterprint', () => { printing = false; sync(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      sync();
    }, {threshold: 0.1}).observe(visual);
  } else {
    inView = true;
  }
  sync();
})();
