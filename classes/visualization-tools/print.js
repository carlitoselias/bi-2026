/* Print uses the lesson's content, in an isolated layout with deliberate pages. */
(() => {
  if (document.body.dataset.page !== 'lesson') return;
  const localAssets = new URL('.', document.currentScript.src);
  const assets = new URL('.', document.querySelector('link[href*="codificacion.css"]').href);
  const host = document.createElement('div');
  host.className = 'pdf-host';
  host.setAttribute('aria-hidden', 'true');
  const root = host.attachShadow({mode:'open'});
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = new URL('impresion.css?v=142', assets).href;
  const stylesReady = [new Promise(resolve => {style.onload=resolve;style.onerror=resolve;})];
  root.append(style);
  if (document.querySelector('[data-class="herramientas-y-diseno"], [data-class="herramientas-para-explorar-y-visualizar-datos"]')) {
    const workshopStyle = document.createElement('link');
    workshopStyle.rel = 'stylesheet';
    workshopStyle.href = new URL('styles.css', localAssets).href;
    stylesReady.push(new Promise(resolve => {workshopStyle.onload=resolve;workshopStyle.onerror=resolve;}));
    root.append(workshopStyle);
  }
  const ready = Promise.all(stylesReady);
  const deck = document.createElement('div');
  deck.className = 'pdf-deck';
  root.append(deck);
  document.body.append(host);
  const lesson = document.querySelector('.lesson');
  const title = lesson.querySelector('h1')?.textContent || document.title;
  const label = lesson.querySelector('.lesson-cover .eyebrow')?.textContent || 'BI 2026';
  let sheets=[];

  function clone(node) {
    const copy = node.cloneNode(true);
    copy.removeAttribute('hidden');
    copy.querySelectorAll('[hidden]').forEach(el=>el.removeAttribute('hidden'));
    copy.querySelectorAll('details').forEach(el=>{el.open=true;});
    copy.querySelectorAll('iframe,dialog,button,.survey-embed,.vision-controls,.vision-control').forEach(el=>el.remove());
    copy.querySelectorAll('img').forEach(el=>{el.loading='eager';});
    return copy;
  }
  function sheet(index, heading, detail='') {
    const page = document.createElement('article');
    page.className='pdf-page';
    page.dataset.scene=String(index);
    const header=document.createElement('header');header.className='pdf-header';
    const mark=document.createElement('span');mark.className='pdf-mark';mark.textContent='bi/';
    const name=document.createElement('span');name.textContent='Business Intelligence';
    const logo=document.createElement('img');logo.src=document.querySelector('.institution-light').src;logo.alt='Universidad del Desarrollo';
    header.append(mark,name,logo);
    const content=document.createElement('div');content.className='pdf-content';
    if(heading){const h=document.createElement('h2');h.textContent=heading;content.append(h);}
    if(detail){const p=document.createElement('p');p.className='pdf-detail';p.textContent=detail;content.append(p);}
    const footer=document.createElement('footer');footer.className='pdf-footer';
    const context=document.createElement('span');context.textContent=`${label} · Slide ${String(index).padStart(2,'0')}`;
    const number=document.createElement('span');number.className='pdf-folio';
    footer.append(context,number);page.append(header,content,footer);deck.append(page);
    const result={page,content,heading,index,detail};sheets.push(result);return result;
  }
  function overflow(s) {return s.content.scrollHeight>s.content.clientHeight+2;}
  function addBlocks(index,heading,blocks,detail='') {
    let current=sheet(index,heading,detail);
    for(const block of blocks){
      current.content.append(block);
      if(overflow(current))current.page.classList.add('pdf-compact');
      if(overflow(current) && current.content.children.length>(detail?3:2)) {
        block.remove();current=sheet(index,heading,'Continued');current.content.append(block);
      }
      // Long tables continue with their header and complete rows, never a small-font scale.
      const table=block.matches('table')?block:block.querySelector('table');
      if(table && overflow(current)) {
        const rows=[...table.querySelectorAll('tbody>tr')];
        const body=table.querySelector('tbody');body.replaceChildren();
        let activeBody=body;
        for(const row of rows){
          activeBody.append(row);
          if(overflow(current) && activeBody.children.length>1){
            row.remove();
            const nextTable=table.cloneNode(true);nextTable.querySelector('tbody').replaceChildren();
            current=sheet(index,heading,'Continued');current.content.append(nextTable);
            activeBody=nextTable.querySelector('tbody');activeBody.append(row);
          }
        }
      }
      if(overflow(current))current.page.classList.add('pdf-compact');
    }
  }
  function prepare() {
    deck.replaceChildren();sheets=[];
    const references=new Map();
    [...lesson.querySelectorAll('[data-scene]')].forEach((scene,i)=>{
      const body=clone(scene.querySelector('.section-body'));
      const heading=body.querySelector('h2');const headingText=heading?.textContent||'';heading?.remove();
      if(scene.classList.contains('lesson-cover')){
        const s=sheet(i+1,'');s.page.classList.add('pdf-cover');s.content.append(...body.children);return;
      }
      if(scene.classList.contains('source-section')){
        // Dense source slides retain every paragraph and figure on continuation sheets.
        body.querySelector('.encoding-family')?.remove();
        body.querySelectorAll('.r-spread').forEach(spread=>{
          const copy=spread.querySelector('.r-copy');
          const figure=spread.querySelector(':scope>.r-figure');
          spread.replaceWith(...copy.children,...(figure?[figure]:[]));
        });
        const blocks=[];
        for(const block of body.children){
          if(block.matches('.r-grid,.r-steps')){
            const size=block.classList.contains('r-grid-3')?3:block.classList.contains('r-grid-1')?1:2;
            const children=[...block.children];
            for(let n=0;n<children.length;n+=size){
              const row=block.cloneNode(false);
              if(block.matches('.r-steps'))row.style.counterReset=`source-steps ${n}`;
              row.append(...children.slice(n,n+size));blocks.push(row);
            }
          } else blocks.push(block);
        }
        addBlocks(i+1,headingText,blocks);
        return;
      }
      const conceptMap=body.querySelector('.concept-map');
      if(conceptMap){
        // Keep the web hierarchy intact; print its long branches on separate sheets.
        const inputs=conceptMap.querySelector('.concept-inputs');
        const bridge=conceptMap.querySelector('.concept-bridge');
        const families=conceptMap.querySelector('.concept-families');
        const encode=families.querySelector('.concept-encode');
        const combination=conceptMap.querySelector('.concept-combination');
        const addConceptPage=(detail,nodes)=>{
          const s=sheet(i+1,headingText,detail);
          const wrapper=document.createElement('div');wrapper.className='concept-map pdf-concept-part';
          wrapper.append(...nodes);s.content.append(wrapper);
        };
        addConceptPage('What and why',[inputs]);
        const encodingFamily=families.cloneNode(false);encodingFamily.append(encode);
        addConceptPage('How · Encode',[bridge.cloneNode(true),encodingFamily]);
        addConceptPage('How · Manipulate, arrange views and reduce',[bridge,families,combination]);
        return;
      }
      const history=body.querySelector('.history-timeline');
      if(history){
        const intro=body.querySelector('.lead');
        [...history.children].forEach(item=>{
          const s=sheet(i+1,headingText);s.page.classList.add('pdf-history');
          if(intro)s.content.append(intro.cloneNode(true));
          s.content.append(item);
        });
        [...body.children].filter(el=>el!==history&&el!==intro).forEach(el=>sheets[sheets.length-1].content.append(el));
        return;
      }
      const details=[...body.querySelectorAll('details')].filter(d=>!d.parentElement.closest('details'));
      details.forEach(d=>d.remove());
      const blocks=[...body.children].filter(el=>el.textContent.trim() || el.querySelector('svg,img'));
      const note=scene.querySelector('.margin-note');
      if(note){
        const columns=document.createElement('div');columns.className='pdf-with-note';
        const main=document.createElement('div');main.append(...blocks);columns.append(main,clone(note));
        addBlocks(i+1,headingText,[columns]);
      } else addBlocks(i+1,headingText,blocks);
      details.forEach(d=>{
        const sub=d.querySelector('summary')?.textContent||'Detail';d.querySelector('summary')?.remove();
        const inner=d.children.length===1 && d.firstElementChild.tagName==='DIV'?d.firstElementChild:d;
        if(d.classList.contains('task-source')){
          const key=inner.textContent.trim();
          if(references.has(key))references.get(key).scenes.push(i+1);
          else references.set(key,{inner,scenes:[i+1],sub});
          return;
        }
        if(inner.textContent.length<650 && !inner.querySelector('table,svg,img')) {
          const reference=document.createElement('div');reference.className='pdf-reference';
          const name=document.createElement('strong');name.textContent=sub;reference.append(name,...inner.children);
          const last=sheets[sheets.length-1];last.content.append(reference);
          if(overflow(last)){reference.remove();addBlocks(i+1,headingText,[reference],sub);}
        } else {
          const parts=inner.classList.contains('editorial-columns')?[inner]:[...inner.children];
          addBlocks(i+1,headingText,parts,sub);
        }
      });
    });
    for(const ref of references.values()){
      const s=sheet(ref.scenes[0],'Sources and references',`Slides ${ref.scenes.join(', ')} · ${ref.sub}`);
      s.content.append(...ref.inner.children);
    }
    sheets.forEach((s,i)=>{
      s.page.querySelector('.pdf-folio').textContent=`${String(i+1).padStart(2,'0')} / ${String(sheets.length).padStart(2,'0')}`;
      // Keep inline SVG references unique across repeated blocks.
      const mapping=new Map();s.page.querySelectorAll('[id]').forEach(el=>{const old=el.id;el.id=`pdf-${i}-${old}`;mapping.set(old,el.id);});
      s.page.querySelectorAll('*').forEach(el=>{for(const a of [...el.attributes]){
        let value=a.value;for(const [old,id] of mapping){value=value.replaceAll(`url(#${old})`,`url(#${id})`);if(['aria-labelledby','aria-describedby'].includes(a.name))value=value.split(' ').map(v=>v===old?id:v).join(' ');}
        if(value!==a.value)el.setAttribute(a.name,value);
      }});
    });
    host.dataset.pages=String(sheets.length);
    host.dataset.overflow=String(sheets.filter(overflow).length);
  }
  window.VizPrint={ready,prepare};
})();
