(() => {
  document.querySelectorAll('[data-five-second-test]').forEach(test => {
    const chart = test.querySelector('[data-flash-chart]');
    const prompt = test.querySelector('[data-flash-prompt]');
    const button = test.querySelector('[data-flash-start]');
    const status = test.querySelector('[data-flash-status]');
    let timer;
    function finish() {
      clearTimeout(timer);
      timer = undefined;
      chart.hidden = true;
      prompt.hidden = false;
      prompt.textContent = 'What did you see first?';
      button.disabled = false;
      button.textContent = 'Repeat test';
      status.textContent = 'Time is up.';
    }
    button.addEventListener('click', () => {
      clearTimeout(timer);
      chart.hidden = false;
      prompt.hidden = true;
      button.disabled = true;
      status.textContent = 'Watch for 5 seconds.';
      timer = setTimeout(finish, 5000);
    });
    window.addEventListener('hashchange', () => { if (timer !== undefined) finish(); });
    // BI navigation uses replaceState, so leaving a scene does not emit hashchange.
    const scene = test.closest('[data-scene]');
    new MutationObserver(() => { if (scene.hidden && timer !== undefined) finish(); })
      .observe(scene, {attributes: true, attributeFilter: ['hidden']});
    document.addEventListener('visibilitychange', () => { if (document.hidden && timer !== undefined) finish(); });
  });
})();
// One persistent set of particles, seven arrangements, and a seamless return.
(() => {
  const host = document.querySelector('[data-chart-morph]');
  if (!host) return;
  const layer = host.querySelector('.chart-morph-particles');
  const toggle = host.querySelector('[data-chart-morph-toggle]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const count = 168, vertices = 12, hold = 1800, travel = 1700;
  const rect = (x,y,w,h) => [[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
  // Sample every edge, preserving corners and matching all paths' vertex counts.
  const sample = polygon => {
    const points = [];
    polygon.forEach((a,i) => {
      const b=polygon[(i+1)%polygon.length];
      const steps=Math.floor(vertices/polygon.length)+(i<vertices%polygon.length?1:0);
      for(let k=0;k<steps;k++) points.push([a[0]+(b[0]-a[0])*k/steps,a[1]+(b[1]-a[1])*k/steps]);
    });
    return points;
  };
  const shape = (polygon,accent=0,opacity=1) => ({points:sample(polygon),accent,opacity});
  const dot = (x,y,r=2.6,opacity=.8) => ({points:Array.from({length:vertices},(_,i)=>{
    const a=-Math.PI*.75+i*Math.PI*2/vertices;
    return [x+Math.cos(a)*r,y+Math.sin(a)*r];
  }),accent:0,opacity});
  const fan = (polygon,n,accent=0,opacity=1) => {
    const center=polygon.reduce((v,p)=>[v[0]+p[0]/polygon.length,v[1]+p[1]/polygon.length],[0,0]);
    const pieces=[];
    polygon.forEach((a,i)=>{
      const b=polygon[(i+1)%polygon.length];
      const steps=Math.floor(n/polygon.length)+(i<n%polygon.length?1:0);
      for(let k=0;k<steps;k++){
        const at=t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
        pieces.push(shape([center,at(k/steps),at((k+1)/steps)],accent,opacity));
      }
    });
    return pieces;
  };
  let seed=781;
  const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
  const cloud=Array.from({length:count},()=>dot(48+random()*424,44+random()*292));
  const bars=Array.from({length:count},(_,i)=>{
    const group=Math.floor(i/42),cell=i%42,h=[155,220,180,270][group];
    return shape(rect(70+group*100+(cell%6)*11,320-h+Math.floor(cell/6)*h/7,11,h/7),group===3?100:0);
  });
  const profiles=[[270,240,250,180,165,115,75],[290,260,270,240,225,230,200],[205,220,195,205,170,175,140]];
  const lines=Array.from({length:count},(_,i)=>{
    const group=Math.floor(i/56),k=i%56,t=k/55*6,j=Math.min(5,Math.floor(t)),f=t-j;
    const values=profiles[group],x=48+k*424/55,y=values[j]+(values[j+1]-values[j])*f;
    const angle=Math.atan2(values[j+1]-values[j],424/6),w=8.4,h=group===0?3.5:2;
    const points=rect(-w/2,-h/2,w,h).map(([a,b])=>[x+a*Math.cos(angle)-b*Math.sin(angle),y+a*Math.sin(angle)+b*Math.cos(angle)]);
    return shape(points,group===0?100:0,group===0?1:.5);
  });
  const zones=[
    [[100,94],[168,60],[223,80],[202,143],[135,157]],
    [[223,80],[286,65],[341,100],[318,166],[202,143]],
    [[341,100],[409,128],[424,183],[370,222],[318,166]],
    [[135,157],[202,143],[257,155],[247,222],[178,248],[120,214]],
    [[257,155],[318,166],[370,222],[321,266],[247,222]],
    [[178,248],[247,222],[321,266],[279,302],[199,287]]
  ];
  const map=zones.flatMap((zone,i)=>{
    const center=zone.reduce((a,p)=>[a[0]+p[0]/zone.length,a[1]+p[1]/zone.length],[0,0]);
    return fan(zone.map(p=>[center[0]+(p[0]-center[0])*.97,center[1]+(p[1]-center[1])*.97]),28,i===4?100:0,1);
  });
  const scatter=Array.from({length:count},(_,i)=>{
    const x=60+random()*400,y=315-(x-60)*.56+(random()-.5)*100;
    return dot(x,Math.max(50,Math.min(330,y)),2.6,.55);
  });
  const heat=Array.from({length:count},(_,i)=>{
    const x=i%14,y=Math.floor(i/14);
    const intensity=Math.min(1,Math.exp(-((x-9)**2+(y-3)**2)/9)+.7*Math.exp(-((x-3)**2+(y-8)**2)/6));
    return shape(rect(64+x*28,36+y*25,27,24),intensity*100,.14+intensity*.86);
  });
  const treemap=[rect(64,50,195,280),rect(263,50,193,138),rect(263,192,114,138),rect(381,192,75,138)]
    .flatMap((box,i)=>fan(box,42,i===0?100:0,[1,1,.65,.35][i]));
  const states=[cloud,bars,lines,map,scatter,heat,treemap];
  if(states.some(state=>state.length!==count)) return;
  const paths=cloud.map(()=>{
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    layer.append(path);return path;
  });
  function draw(from,to,t){
    paths.forEach((path,i)=>{
      const a=from[i],b=to[i];
      const points=a.points.map((p,j)=>[p[0]+(b.points[j][0]-p[0])*t,p[1]+(b.points[j][1]-p[1])*t]);
      path.setAttribute('d',points.map((p,j)=>`${j?'L':'M'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('')+'Z');
      const accent=a.accent+(b.accent-a.accent)*t;
      path.style.fill=`color-mix(in srgb, var(--rust) ${accent.toFixed(1)}%, var(--ink))`;
      path.style.opacity=(a.opacity+(b.opacity-a.opacity)*t).toFixed(3);
    });
  }
  let elapsed=0,last=null,frame=null,inView=false,userPaused=false,printing=false;
  const active=()=>inView&&!document.hidden&&!reduced.matches&&!userPaused&&!printing;
  function tick(now){
    frame=null;
    if(!active()){last=null;return;}
    if(last!==null) elapsed+=Math.min(now-last,80);
    last=now;
    const duration=hold+travel,index=Math.floor(elapsed/duration)%states.length,local=elapsed%duration;
    const raw=Math.max(0,(local-hold)/travel),t=raw*raw*(3-2*raw);
    draw(states[index],states[(index+1)%states.length],t);
    frame=requestAnimationFrame(tick);
  }
  function sync(){
    if(frame!==null) cancelAnimationFrame(frame);
    frame=null;last=null;
    toggle.hidden=reduced.matches;
    if(active()) frame=requestAnimationFrame(tick);
  }
  toggle.addEventListener('click',()=>{
    userPaused=!userPaused;
    toggle.setAttribute('aria-pressed',String(userPaused));
    toggle.setAttribute('aria-label',userPaused?'Resume animation':'Pause animation');
    toggle.firstElementChild.textContent=userPaused?'▶':'Ⅱ';
    sync();
  });
  new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;sync();},{threshold:.15}).observe(host);
  document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',sync);
  window.addEventListener('beforeprint',()=>{printing=true;sync();});
  window.addEventListener('afterprint',()=>{printing=false;sync();});
  draw(cloud,cloud,0);
  host.classList.add('is-ready');
  sync();
})();
