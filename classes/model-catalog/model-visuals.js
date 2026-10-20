/* Original SVG teaching diagrams. Animations connect explicit computed states. */
window.ModelVisuals = (() => {
  'use strict';
  const M=window.LabMath, fmt=(x,n=1)=>Number(x).toFixed(n);
  const C={ink:'var(--ink)',muted:'var(--muted)',mint:'var(--plot-mint)',cyan:'var(--plot-cyan)',amber:'var(--plot-amber)',pink:'var(--plot-pink)',line:'var(--line)',panel:'var(--panel)'};
  const palettes=[C.mint,C.amber,C.cyan,C.pink];
  const xml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const txt=(x,y,s,cls='',anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}">${xml(s)}</text>`;
  const line=(x1,y1,x2,y2,color=C.line,width=2,dash='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
  const flowArrow=(x1,x2,y,color)=>`<path class="process-connector" d="M${x1} ${y}H${x2}M${x2-6} ${y-5}L${x2} ${y}L${x2-6} ${y+5}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  const circle=(x,y,r,color,stroke='none')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="${stroke}" stroke-width="3"/>`;
  const diamond=(x,y,r=9)=>`<path d="M${x},${y-r} l${r},${r} l-${r},${r} l-${r},-${r}z" fill="${C.amber}" stroke="${C.ink}" stroke-width="2"/>`;
  function box(x,y,w,h,title,sub='',active=false){return `<rect x="${x-w/2}" y="${y}" width="${w}" height="${h}" rx="12" fill="${active?'var(--panel2)':C.panel}" stroke="${active?C.mint:C.line}" stroke-width="${active?3:1.5}"/>${txt(x,y+(sub?28:h/2+6),title,'mv-node')}${sub?txt(x,y+52,sub,'mv-sub'):''}`;}
  function svg(body,label){return `<svg class="mv-svg" viewBox="0 0 800 400" role="img" aria-label="${xml(label)}">${body}</svg>`;}
  let frameProgress=1;
  const fade=(s,from,body)=>`<g opacity="${s>from?1:s===from?.16+.84*frameProgress:.16}">${body}</g>`;
  const reveal=(s,from,body)=>s<from?'':`<g opacity="${s===from?frameProgress:1}">${body}</g>`;
  const lerp=(a,b,t)=>a+(b-a)*t;
  function axes(xLabel,yLabel,xmax,ymax){let b=txt(72,24,yLabel,'mv-axis','start');for(let i=0;i<=4;i++){const y=330-i*70;b+=line(75,y,735,y)+txt(60,y+5,(ymax===1?fmt(ymax*i/4,2):Number(fmt(ymax*i/4,2))),'mv-tick','end');}for(let i=0;i<=4;i++)b+=txt(75+i*165,356,Number(fmt(xmax*i/4,2)),'mv-tick');return b+txt(410,391,xLabel,'mv-axis');}
  const coords=(x,y,xmax,ymax)=>[75+x/xmax*660,330-y/ymax*280];
  function poly(fn,xmax,ymax){return `<path d="${Array.from({length:151},(_,i)=>{const [x,y]=coords(xmax*i/150,fn(xmax*i/150),xmax,ymax);return `${i?'L':'M'}${x},${y}`;}).join(' ')}" fill="none" stroke="${C.mint}" stroke-width="4"/>`;}
  const select=(id,label,opts,value)=>`<label for="${id}">${label}<select id="${id}">${opts.map(([v,t])=>`<option value="${v}" ${String(v)===String(value)?'selected':''}>${t}</option>`).join('')}</select></label>`;
  const steps=(titles,texts,results)=>titles.map((title,i)=>({title,text:texts[i],result:results[i]}));

  // The trace records assignments and means in standardized feature space.
  // Drawing interpolation is only a visual transition, never a new fit.
  function clusterTrace(k=3,seed=0){
    const rows=M.shops,mu=[0,1].map(j=>M.mean(rows.map(r=>r[j]))),sd=[0,1].map(j=>Math.sqrt(M.mean(rows.map(r=>(r[j]-mu[j])**2))));
    const x=rows.map(r=>r.map((v,j)=>(v-mu[j])/sd[j]));
    const starts=seed?[2,7,10,0]:[0,4,8,11];let centers=starts.slice(0,k).map(i=>x[i].slice()),labels=[];
    const raw=c=>c.map(r=>r.map((v,j)=>v*sd[j]+mu[j]));
    const trace=[{kind:'data',centers:[],labels:[]},{kind:'initial',centers:raw(centers),labels:[]}];
    for(let iter=0;iter<100;iter++){
      labels=x.map(r=>centers.map(c=>r.reduce((s,v,j)=>s+(v-c[j])**2,0)).reduce((best,v,j,a)=>v<a[best]?j:best,0));
      trace.push({kind:'assign',iteration:iter+1,centers:raw(centers),labels:labels.slice()});
      const next=centers.map((c,h)=>{const group=x.filter((_,i)=>labels[i]===h);return group.length?[0,1].map(j=>M.mean(group.map(r=>r[j]))):c;});
      const diff=next.reduce((s,c,i)=>s+c.reduce((v,n,j)=>v+(n-centers[i][j])**2,0),0);
      if(diff<1e-12){trace.push({kind:'done',centers:raw(next),labels:labels.slice()});break;}
      trace.push({kind:'move',iteration:iter+1,centers:raw(next),from:raw(centers),labels:labels.slice()});centers=next;
    }
    return trace;
  }

  const specs={
    'fit-process':{
      process:true,name:'Learn a rule',context:'',type:'',hideMotionNote:true,hideStepLinks:true,
      limit:'',
      referenceId:'apply-rule',referenceLabel:'Next: apply the same rule →',transitionMs:1800,defaults:{},controls:()=>'',read:()=>({}),
      states:()=>steps(['Start with known rows','Send inputs and answers to Fit','Find a rule for these rows','Save the learned rule'],['Each training row contains a known distance and its observed duration. Both are available for fitting.','The distance and duration travel together. Each pair becomes one point in the fitting diagram.','This illustrative fitted line follows the three points: an intercept of 10 minutes and a slope of 2 minutes per kilometre.','Keep the coefficients. The next slide uses this same rule with a new distance; it does not fit again.'],['(2 km, 14 min) · (4 km, 18 min) · (6 km, 22 min)','Inputs + known answers → Fit','Intercept = 10 min · slope = 2 min/km','Minutes = 10 + 2 × km']),
      draw(v,s,t){
        let b=txt(145,52,'Training rows','mv-emphasis')+txt(405,52,'Fit','mv-emphasis')+txt(660,52,'Saved rule','mv-emphasis');
        b+=`<rect x="30" y="90" width="230" height="215" rx="12" fill="${C.panel}" stroke="${C.line}"/>`+txt(89,123,'km','mv-axis')+txt(197,123,'min','mv-axis')+line(50,138,240,138);
        [[2,14],[4,18],[6,22]].forEach((r,i)=>{b+=txt(89,173+i*49,r[0])+txt(197,173+i*49,r[1]);});
        b+=flowArrow(270,300,197.5,s>=1?C.mint:C.muted);
        b+=`<rect x="310" y="90" width="190" height="215" rx="12" fill="none" stroke="${s===1||s===2?C.mint:C.line}"/>`;
        b+=line(355,250,475,250,C.muted)+line(355,140,355,250,C.muted)+txt(368,120,'min','mv-axis')+txt(475,291,'km','mv-axis','end');
        [0,4,8].forEach(x=>b+=txt(355+x/8*120,273,x,'mv-tick'));[0,10,20,30].forEach(y=>b+=txt(348,255-y/30*110,y,'mv-tick','end'));
        if(s>=1)[[2,14],[4,18],[6,22]].forEach((r,i)=>{const u=s===1?t:1,x=355+r[0]/8*120,y=250-r[1]/30*110;b+=circle(lerp(145,x,u),lerp(167+i*49,y,u),6,C.cyan);});
        if(s>=2){const u=s===2?t:1;b+=line(355,250-10/30*110,lerp(355,475,u),lerp(250-10/30*110,250-26/30*110,u),C.mint,3);}
        b+=flowArrow(510,535,197.5,s>=3?C.mint:C.muted);
        b+=`<rect x="545" y="90" width="230" height="215" rx="12" fill="${C.panel}" stroke="${s===3?C.mint:C.line}" stroke-width="${s===3?3:1.5}"/>`;
        // Coefficients travel out of the fitted line and lock into two saved slots.
        b+=txt(660,123,'Minutes =','mv-node');
        b+=`<rect x="564" y="146" width="65" height="46" rx="7" fill="none" stroke="${C.line}"/><rect x="659" y="146" width="45" height="46" rx="7" fill="none" stroke="${C.line}"/>`+txt(645,177,'+','mv-node')+txt(737,177,'× km','mv-node');
        if(s<3){b+=txt(597,177,'?','mv-emphasis')+txt(681,177,'?','mv-emphasis')+txt(660,236,'Ready to save','mv-sub');}
        else{const u=Math.min(1,t*1.5),w=Math.max(0,Math.min(1,(t-.25)/.75));b+=txt(lerp(355,597,u),lerp(213,177,u),'10','mv-emphasis')+txt(lerp(440,681,w),lerp(164,177,w),'2','mv-emphasis');b+=`<g opacity="${t}">`+txt(660,229,'Intercept: 10 min','mv-sub')+txt(660,260,'Slope: 2 min/km','mv-sub')+'</g>';}

        b+=txt(145,347,'Known distances + durations','mv-sub')+txt(660,347,'Keep for prediction','mv-sub');
        return svg(b,`Training sequence: ${['known distance and duration pairs','pairs move into Fit','the fitted line is drawn','coefficients are saved'][s]}. Distances 2, 4, 6 km; durations 14, 18, 22 min. Saved rule: minutes = 10 + 2 times km.`);
      }
    },
    'predict-process':{
      process:true,name:'Apply the same rule',context:'',type:'',hideMotionNote:true,hideStepLinks:true,
      limit:'',
      referenceId:'learning-terms',referenceLabel:'Next: learned values and chosen settings →',transitionMs:1100,defaults:{},controls:()=>'',read:()=>({}),
      states:()=>steps(['Start with a new input','Insert the distance','Multiply by the saved slope','Add the saved intercept','Return the estimate'],['Only the distance is supplied. The duration remains unknown. The saved rule is ready for use.','Move 8 km into the input position of the saved rule. Neither coefficient changes.','The distance contribution is 2 min/km × 8 km = 16 min. This is one part of the prediction.','Add the intercept: 10 min + 16 min = 26 min. This is the model output for this input.','Send the output to the new delivery: an estimated duration of 26 minutes. Its true duration is still unknown.'],['Distance = 8 km · duration = ?','10 + 2 × 8','2 × 8 = 16 min','10 + 16 = 26 min','Estimated duration: 26 min']),
      draw(v,s,t){
        let b=txt(400,29,'Saved rule: minutes = 10 + 2 × km','mv-emphasis')+txt(135,92,'New row','mv-emphasis')+txt(407,92,'Predict','mv-emphasis')+txt(675,92,'Estimated duration','mv-emphasis');
        b+=box(135,129,210,145,'','',s===0)+txt(135,163,'Distance','mv-sub')+txt(135,196,'8 km','mv-emphasis')+txt(135,246,'Duration: ?','mv-sub');
        b+=flowArrow(252,290,201.5,s>=1?C.mint:C.muted);
        b+=box(407,129,210,145,'','',s>=1&&s<=3);
        const equations=['10 + 2 × km','10 + 2 × 8','10 + 16','26 min'];
        b+=txt(407,173,'Same coefficients','mv-sub');
        if(s===1&&t<1){b+=txt(407,214,'10 + 2 × …','mv-node')+txt(lerp(135,468,t),lerp(196,214,t),'8','mv-emphasis');}
        else if((s===2||s===3)&&t<1){b+=`<g opacity="${1-t}">`+txt(407,214,equations[s-1],'mv-emphasis')+'</g>'+`<g opacity="${t}" transform="translate(0 ${12*(1-t)})">`+txt(407,214,equations[s],'mv-emphasis')+'</g>';}
        else b+=txt(407,214,equations[Math.min(s,3)],'mv-emphasis');
        b+=flowArrow(524,558,201.5,s>=4?C.mint:C.muted);
        b+=box(675,129,210,145,'','',s===4);
        if(s<4)b+=txt(675,207,'Waiting for Predict','mv-sub');else if(t<1)b+=txt(lerp(407,675,t),214,'26 min','mv-emphasis');else b+=txt(675,214,'26 min','mv-emphasis');
        b+=txt(135,324,'New distance only','mv-sub')+txt(407,324,'The rule stays fixed','mv-sub')+txt(675,324,'Prediction ≠ observation','mv-sub');
        return svg(b,`Prediction sequence: ${['a new delivery has distance 8 km and unknown duration','8 km is inserted into the saved rule','2 times 8 equals 16 minutes','10 plus 16 equals 26 minutes','26 minutes is returned as an estimate'][s]}. The rule stays minutes = 10 + 2 times km; there is no new fit.`);
      }
    },
    linear:{
      name:'Linear regression',subtitle:'A line becomes a prediction.',context:'Five synthetic home sales · area in m² → price in $ thousands.',type:'Computed line and prediction',
      limit:'The five sales define the line here. Moving the new home does not refit it. A line alone does not prove a causal effect.',defaults:{area:65},
      controls:v=>select('mv-area','New home',[[45,'45 m²'],[65,'65 m²'],[75,'75 m²']],v.area),read:q=>({area:+q('#mv-area').value}),
      states:v=>{const y=40+2*v.area;return steps(['Known examples','Fit a line','Place a new input','Follow the fitted rule','Read the prediction'],['Each circle is an invented home sale with known area and price.','Least squares gives intercept 40 $k and slope 2 $k per m².','The new area is known. Its sale price is not used.','Move from the input up to the line, then across to the price axis.','Apply the same rule to this new home. This is prediction, not a new fit.'],['5 training sales','price = 40 + 2 × area',`${v.area} m²`,`40 + 2 × ${v.area}`,`$${fmt(y,0)}k`]);},
      draw(v,s,t){const fit=M.linear([[40,120],[50,140],[60,160],[70,180],[80,200]]),prediction=fit.a+fit.b*v.area,[px,py]=coords(v.area,prediction,100,250);let b=axes('Home area (m²)','Price ($ thousands)',100,250);[[40,120],[50,140],[60,160],[70,180],[80,200]].forEach(r=>{const p=coords(...r,100,250);b+=circle(...p,6,C.cyan);});b+=fade(s,1,poly(x=>fit.a+fit.b*x,100,250)+txt(510,74,'Fitted rule: 40 + 2 × area','mv-emphasis'));
        if(s>=2)b+=diamond(px,330)+txt(px+12,315,`${v.area} m²`,'mv-emphasis','start');
        if(s>=3){const z=s===3?t:1;b+=line(px,330,px,lerp(330,py,z),C.amber,3,'6 5')+circle(px,lerp(330,py,z),8,C.amber);}
        if(s>=4)b+=line(px,py,lerp(px,75,t),py,C.amber,3,'6 5')+txt(200,py-15,`Prediction: $${fmt(prediction,0)}k`,'mv-emphasis');return svg(b,'Linear regression: known points, fitted line and projection of a new area onto the line.');}
    },
    logistic:{
      name:'Logistic regression',subtitle:'A score becomes a probability. A threshold becomes a decision.',context:'Synthetic booking example · waiting days → probability of a missed visit.',type:'Illustrative fixed rule · live arithmetic',
      limit:'The score −2 + 0.2 × days is invented. The animation applies it; it does not train a clinical model. Probability and class are different outputs.',defaults:{days:15,threshold:.5},
      controls:v=>select('mv-days','Waiting time',[[5,'5 days'],[10,'10 days'],[15,'15 days'],[25,'25 days']],v.days)+select('mv-threshold','Flag if probability ≥',[[.5,'0.50'],[.8,'0.80']],v.threshold),read:q=>({days:+q('#mv-days').value,threshold:+q('#mv-threshold').value}),
      states:v=>{const z=-2+.2*v.days,p=1/(1+Math.exp(-z));return steps(['An input','An additive score','A probability','A decision threshold','A class decision'],['The waiting time is known when the appointment is booked.','The fixed coefficients produce a score. It can be negative or positive.','The logistic curve maps the score to a value between zero and one.','Keep the probability fixed. Compare it with the selected threshold.','The rule flags the booking only when its probability reaches the threshold.'],[`${v.days} days`,`z = −2 + 0.2 × ${v.days} = ${fmt(z)}`,`p = ${fmt(p*100)}%`,`threshold = ${fmt(v.threshold,2)}`,p>=v.threshold?'Flag this booking':'Do not flag this booking']);},
      draw(v,s,t){const p=1/(1+Math.exp(-(-2+.2*v.days))),[px,py]=coords(v.days,p,30,1),ty=coords(0,v.threshold,30,1)[1];let b=axes('Waiting time (days)','Probability of a missed visit',30,1);b+=diamond(px,330);b+=fade(s,1,txt(680,24,`score = ${fmt(-2+.2*v.days)}`,'mv-label'));b+=fade(s,2,poly(x=>1/(1+Math.exp(-(-2+.2*x))),30,1));if(s>=2){const u=s===2?t:1;b+=line(px,330,px,lerp(330,py,u),C.amber,3,'6 5')+circle(px,lerp(330,py,u),8,C.amber);}
        if(s>=3)b+=line(75,ty,lerp(75,735,s===3?t:1),ty,C.pink,3,'8 5')+txt(720,ty-12,`Threshold ${fmt(v.threshold,2)}`,'mv-pink','end');b+=reveal(s,4,box(555,260,285,58,p>=v.threshold?'FLAG':'DO NOT FLAG', '',true));return svg(b,'Logistic probability curve with a selected waiting time and a separate decision threshold.');}
    },
    knn:{
      name:'k nearest neighbours',subtitle:'Find similar inputs. Combine their known answers.',context:'Twelve synthetic deliveries · distance in km → duration in minutes.',type:'Live neighbour selection and mean',
      limit:'Only horizontal distance (km) selects neighbours. Duration is the target, not a distance input. Equal distances use the earlier training row.',defaults:{x:6.5,k:2},
      controls:v=>select('mv-trip','New trip',[[4.5,'4.5 km'],[6.5,'6.5 km'],[9.5,'9.5 km']],v.x)+select('mv-k','Neighbours k',[[1,1],[2,2],[3,3],[5,5]],v.k),read:q=>({x:+q('#mv-trip').value,k:+q('#mv-k').value}),
      nearest:v=>M.training.map((r,i)=>({r,i,d:Math.abs(r[0]-v.x)})).sort((a,b)=>a.d-b.d||a.i-b.i).slice(0,v.k),
      states(v){const near=this.nearest(v),p=M.knn(M.training,v.x,v.k);return steps(['Stored training cases','A new trip','Find the nearest inputs','Average their durations','Predict this duration'],['Each training case already has a known distance and duration.','Place the new distance on the horizontal axis. Its duration is unknown.','Rank the horizontal distances. Select the k nearest training trips.','Use uniform weights: each selected duration has equal weight.','The average is the prediction for the new trip. No global line is fitted.'],['12 known trips',`${v.x} km`,`${v.k} nearest trips`,`(${near.map(n=>n.r[1]).join(' + ')}) / ${v.k}`,`${fmt(p,2)} min`]);},
      draw(v,s,t){const near=this.nearest(v),prediction=M.knn(M.training,v.x,v.k),[px,py]=coords(v.x,prediction,12,50);let b=axes('Distance (km) · similarity uses this axis only','Duration (min) · known training answers',12,50);if(s>=2){const xs=near.map(n=>n.r[0]),x1=coords(Math.min(...xs),0,12,50)[0],x2=coords(Math.max(...xs),0,12,50)[0];b+=`<rect x="${x1-14}" y="50" width="${x2-x1+28}" height="280" fill="${C.mint}" opacity=".07"/>`;}
        M.training.forEach((r,i)=>{const [x,y]=coords(...r,12,50),selected=s>=2&&near.some(n=>n.i===i);b+=circle(x,y,selected?lerp(6,9,s===2?t:1):6,selected?C.mint:C.cyan);if(selected){b+=line(x,330,x,y,C.mint,2,'3 5')+txt(x,y-16,`${r[1]}`,'mv-emphasis');}});
        if(s>=1)b+=diamond(px,330);if(s>=2)b+=line(px,340,coords(near[near.length-1].r[0],0,12,50)[0],340,C.amber,3);
        b+=reveal(s,3,box(400,38,650,54,`(${near.map(n=>n.r[1]).join(' + ')}) / ${v.k}${s>=4?' = '+fmt(prediction,2)+' min':''}`));
        if(s>=4)b+=line(px,330,px,lerp(330,py,t),C.amber,3,'6 5')+diamond(px,lerp(330,py,t));return svg(b,'Nearest-neighbour regression: select by horizontal input distance, then average known target durations.');}
    },
    tree:{
      name:'Decision tree',subtitle:'Follow a branch. Read a leaf.',context:'Synthetic appointments · waiting days → probability of a missed visit.',type:'Illustrative fixed tree · no training run',
      limit:'This small tree has one split. Real trees can have more levels. The split and leaf counts are fixed illustrations; changing the booking only changes its path.',defaults:{days:12},
      controls:v=>select('mv-booking','New booking',[[4,'4 waiting days'],[7,'7 waiting days'],[12,'12 waiting days']],v.days),read:q=>({days:+q('#mv-booking').value}),
      states:v=>{const yes=v.days<=7,p=yes?.2:.8;return steps(['A new booking','Ask the learned rule','Follow one branch','Read the leaf','Turn probability into a class'],['The same input enters the root of the tree.','A split compares an available feature with a threshold. Here: waiting days ≤ 7.','Only one path applies to this booking. The other branch remains unused.','The leaf summarizes the training cases that reached it. These counts are invented.','At threshold 0.50, flag a booking with probability at least 0.50.'],[`${v.days} waiting days`,`${v.days} ≤ 7?`,yes?'Yes → left branch':'No → right branch',yes?'1 missed / 5 = 0.20':'4 missed / 5 = 0.80',`${p>=.5?'Flag':'Do not flag'} · p = ${fmt(p,2)}`]);},
      draw(v,s,t){const yes=v.days<=7,leafX=yes?200:600;let b=box(400,8,260,50,`New booking: ${v.days} days`);b+=line(400,58,400,90,C.amber,3)+fade(s,1,box(400,90,300,64,'Waiting days ≤ 7?', 'Split rule',s===1));
        b+=fade(s,1,line(400,154,200,252)+line(400,154,600,252)+txt(260,205,'Yes','mv-label')+txt(540,205,'No','mv-label')+box(200,252,260,70,'1 / 5 missed','Probability = 0.20',s>=3&&yes)+box(600,252,260,70,'4 / 5 missed','Probability = 0.80',s>=3&&!yes));
        if(s>=2){const u=s===2?t:1;b+=line(400,154,lerp(400,leafX,u),lerp(154,252,u),C.amber,5)+circle(lerp(400,leafX,u),lerp(154,252,u),8,C.amber);}
        if(s>=3){[200,600].forEach((x,j)=>{for(let i=0;i<5;i++)b+=circle(x-48+i*24,345,7,i<(j?4:1)?C.pink:C.cyan);});b+=txt(400,381,'Pink dots = missed visits · cyan dots = attended','mv-tick');}
        if(s>=4)b+=txt(400,230,yes?'p < 0.50 → do not flag':'p ≥ 0.50 → flag','mv-emphasis');return svg(b,`Decision tree: ${v.days} days follows the ${yes?'yes / left':'no / right'} branch to probability ${yes?'0.20':'0.80'}.`);}
    },
    forest:{
      name:'Random Forest',subtitle:'Several different trees. One combined prediction.',context:'Synthetic delivery · known distance, traffic and parcel count → minutes.',type:'Illustrative fixed trees · live path and average',
      limit:'These three trees are invented, not a fitted Random Forest. A real forest learns diverse trees from sampled rows and feature choices; averaging cannot fix shared bias or leakage.',defaults:{trip:0},
      controls:v=>select('mv-forest-trip','Delivery',[[0,'A · 6.5 km · high traffic · 8 parcels'],[1,'B · 10 km · low traffic · 3 parcels']],v.trip),read:q=>({trip:+q('#mv-forest-trip').value}),
      cases:[{km:6.5,traffic:true,load:8},{km:10,traffic:false,load:3}],
      values(v){const x=this.cases[v.trip];return [x.km<=7?22:34,x.traffic?28:18,x.load<=5?20:25];},
      states(v){const vals=this.values(v),x=this.cases[v.trip];return steps(['The same new delivery','Different learned trees','Route the case through each tree','Collect three estimates','Average the estimates'],['All trees receive the same available inputs for the new trip.','These small diagrams illustrate different split rules. Real forests also vary their training samples and feature choices.','Each tree takes its own path. They do not correct a previous tree’s error.','Each selected leaf predicts duration in minutes.','The regression forest combines predictions with a mean.'],[`${x.km} km · ${x.traffic?'high':'low'} traffic · ${x.load} parcels`,'Three different trees','Three paths for one case',vals.map(n=>n+' min').join(' · '),`(${vals.join(' + ')}) / 3 = ${fmt(M.mean(vals),1)} min`]);},
      draw(v,s,t){const x=this.cases[v.trip],decisions=[x.km<=7,x.traffic,x.load<=5],vals=this.values(v),names=['Distance ≤ 7 km?','Traffic is high?','Parcels ≤ 5?'],leaves=[[22,34],[28,18],[20,25]];let b=box(400,5,500,48,`Same delivery: ${x.km} km · ${x.traffic?'high':'low'} traffic · ${x.load} parcels`);
        [145,400,655].forEach((cx,j)=>{const selected=cx+(decisions[j]?-55:55);b+=fade(s,1,line(400,53,cx,90,C.line,2,'4 5')+txt(cx,78,`TREE ${j+1}`,'mv-tick')+box(cx,92,224,52,names[j])+line(cx,144,cx-55,220)+line(cx,144,cx+55,220)+txt(cx-48,181,'Yes','mv-tick')+txt(cx+48,181,'No','mv-tick')+box(cx-55,220,96,49,String(leaves[j][0]),'',s>=3&&decisions[j])+box(cx+55,220,96,49,String(leaves[j][1]),'',s>=3&&!decisions[j]));if(s>=2){const u=s===2?t:1;b+=line(cx,144,lerp(cx,selected,u),lerp(144,220,u),C.amber,4)+circle(lerp(cx,selected,u),lerp(144,220,u),6,C.amber);}if(s>=3)b+=txt(cx,295,`${vals[j]} min`,'mv-emphasis');if(s>=4)b+=line(cx,306,lerp(cx,400,t),lerp(306,334,t),C.mint,2);});if(s>=4)b+=box(400,334,385,55,`Mean prediction: ${fmt(M.mean(vals),1)} min`,'',true);return svg(b,'Random Forest illustration: one delivery passes through three distinct trees and their numeric leaf estimates are averaged.');}
    },
    boost:{
      name:'XGBoost / gradient boosting',subtitle:'Start with a prediction. Add one correction at a time.',context:'Synthetic delivery illustration · output and corrections are in minutes.',type:'Illustrative correction trees · live arithmetic',
      limit:'The correction outputs +10, −2 and +4 stay fixed here. In real boosting, changing the learning rate changes later training. This is not an XGBoost execution or a performance comparison.',defaults:{rate:.3},
      controls:v=>select('mv-rate','Learning rate',[[.1,'0.1'],[.3,'0.3'],[1,'1.0']],v.rate),read:q=>({rate:+q('#mv-rate').value}),
      states(v){const y=[20,20+10*v.rate,20+8*v.rate,20+12*v.rate];return steps(['Start with a simple estimate','Add the first tree','Add the next tree','Add a third tree','Read the ensemble output'],['A starting prediction is the current estimate before these trees are added.','The first correction tree suggests +10 minutes. Add only the learning-rate fraction.','A later correction tree suggests −2 minutes. A correction can lower the current output.','Another correction contributes +4 times the learning rate.','The output is the starting estimate plus all weighted tree contributions. These are fixed teaching values.'],['20.0 min',`20 + ${fmt(v.rate)} × 10 = ${fmt(y[1])}`,`${fmt(y[1])} − ${fmt(v.rate)} × 2 = ${fmt(y[2])}`,`${fmt(y[2])} + ${fmt(v.rate)} × 4 = ${fmt(y[3])}`,`${fmt(y[3])} min`]);},
      draw(v,s,t){const y=[20,20+10*v.rate,20+8*v.rate,20+12*v.rate],cor=[10,-2,4];let b=txt(400,24,'Trees are added in sequence','mv-axis');
        [180,400,620].forEach((cx,i)=>{b+=fade(s,i+1,txt(cx,65,`CORRECTION TREE ${i+1}`,'mv-tick')+circle(cx,105,19,C.panel,C.line)+line(cx,124,cx-43,171)+line(cx,124,cx+43,171)+box(cx-43,171,77,42,'…')+box(cx+43,171,77,42,(cor[i]>0?'+':'')+cor[i],'',s===i+1)+txt(cx,239,`${cor[i]>0?'+':'−'} ${fmt(Math.abs(cor[i])*v.rate)} min`,'mv-emphasis'));});
        [70,290,510,730].forEach((x,i)=>{b+=fade(s,i,box(x,285,125,62,`${fmt(y[i])} min`,i?'Updated':'Start',s===i));if(i<3){b+=line(x+63,316,x+157,316);if(s>=i+1){const u=s===i+1?t:1;b+=line(x+63,316,lerp(x+63,x+157,u),316,C.amber,4)+circle(lerp(x+63,x+157,u),316,6,C.amber);}}});if(s>=4)b+=txt(400,385,`20 + ${fmt(10*v.rate)} − ${fmt(2*v.rate)} + ${fmt(4*v.rate)} = ${fmt(y[3])} min`,'mv-emphasis');return svg(b,'Boosting illustration: weighted outputs of successive correction trees update a running numeric prediction.');}
    },
    kmeans:{
      name:'K-means',subtitle:'Assign. Move the centres. Repeat.',context:'Twelve synthetic customers · monthly items and spend ($); no known group labels.',type:'Live Lloyd assignments and centroid updates',
      limit:'Distances use standardized features; axes show original units. Centre movement connects two computed states. Groups are distance-based descriptions, not verified customer classes.',defaults:{k:3,seed:0},
      controls:v=>select('mv-groups','Groups K',[[2,2],[3,3]],v.k)+select('mv-start','Initial centres',[[0,'Set A'],[1,'Set B']],v.seed),read:q=>({k:+q('#mv-groups').value,seed:+q('#mv-start').value}),
      states(v){return clusterTrace(v.k,v.seed).map(r=>({...r,title:{data:'Start with unlabelled cases',initial:'Place initial centres',assign:'Assign to the nearest centre',move:'Move each centre to its group mean',done:'Stop when the centres do not move'}[r.kind],text:{data:'There is no target to predict. We explore a grouping of numeric features.',initial:'Choose K starting positions. Different starting centres can give a different local result.',assign:'Compare standardized distances. Give each case the ID of its nearest centre.',move:'For each assigned group, calculate its mean. Move its centre to that computed position.',done:'Assignments and centres are stable for this initialization. This does not prove that the groups are useful or true.'}[r.kind],result:r.kind==='data'?'12 customers · no labels':r.kind==='initial'?`${v.k} initial centres`:r.kind==='assign'?`Assignment round ${r.iteration}`:r.kind==='move'?`Mean update ${r.iteration}`:`${v.k} stable groups`}));},
      draw(v,s,t,states){const r=states[s],centers=r.kind==='move'?r.centers.map((c,i)=>c.map((n,j)=>lerp(r.from[i][j],n,t))):r.centers;let b=axes('Items bought / month','Spend ($ / month)',10,100);
        if(r.labels.length)M.shops.forEach((p,i)=>{const a=coords(...p,10,100),z=coords(...centers[r.labels[i]],10,100);const u=r.kind==='assign'?t:1;b+=line(...a,lerp(a[0],z[0],u),lerp(a[1],z[1],u),palettes[r.labels[i]],1.5,'4 4');});M.shops.forEach((p,i)=>{const [x,y]=coords(...p,10,100),has=r.labels.length>0;b+=circle(x,y,9,has?palettes[r.labels[i]]:C.cyan)+txt(x,y+5,has?r.labels[i]+1:'','mv-point-id');});centers.forEach((c,i)=>{const [x,y]=coords(...c,10,100);b+=`<path d="M${x-12},${y} h24 M${x},${y-12} v24" stroke="${C.ink}" stroke-width="5"/><circle cx="${x}" cy="${y}" r="18" fill="none" stroke="${palettes[i]}" stroke-width="2"/>`+txt(x+24,y-14,`C${i+1}`,'mv-emphasis','start');});return svg(b,`K-means: ${r.title}. Coloured numbered dots are customers; labelled crosses are centres.`);}
    }
  };

  Object.assign(specs,{
    dbscan:{
      name:'DBSCAN',subtitle:'Count neighbours. Connect dense regions.',context:'14 invented customers · monthly items and spend ($). Distances use standardized inputs.',type:'Live DBSCAN · eps includes the boundary; counts include the point itself.',
      limit:'Radius and density are chosen settings. Noise is not proof of an error. Group IDs are arbitrary; traversal follows the displayed row order.',defaults:{eps:.65,minPts:3},
      controls:v=>select('mv-eps','Radius eps',[[.4,'0.40'],[.65,'0.65'],[1,'1.00']],v.eps)+select('mv-density','Minimum neighbours',[[3,3],[4,4]],v.minPts),read:q=>({eps:+q('#mv-eps').value,minPts:+q('#mv-density').value}),
      states(v){const r=M.dbscan(v.eps,v.minPts);return [
        {kind:'data',title:'Start without group labels',text:'Each dot is one customer. Standardize items and spend so the distance rule does not use their raw numerical scales.',result:'14 customers · 2 features',r},
        {kind:'radius',title:'Inspect one neighbourhood',text:'The outline marks radius eps around customer 6. Count every case inside it, including customer 6 itself.',result:`${r.near[5].length} neighbours; ${v.minPts} needed → ${r.core[5]?'core point':'not a core point'}`,r},
        {kind:'core',title:'Find the core points',text:'A ring marks every point with enough neighbours. A core point can extend a group to other core points within its radius.',result:`${r.core.filter(Boolean).length} core points`,r},
        ...r.trace.map(t=>({kind:'group',title:`Grow group ${t.group+1}`,text:'Connect reachable core points. Attach nearby border points without expanding from them. The next group starts from a remaining core point.',result:`${t.labels.filter(n=>n===t.group).length} customers in this group`,r,labels:t.labels})),
        {kind:'done',title:'Read groups and noise',text:'Colours and numbers identify groups. Rings mark core points; crosses mark noise. A group number has no business meaning until we inspect its members.',result:`${r.groups} groups · ${r.noise} noise points`,r,labels:r.labels}
      ];},
      draw(v,s,t,states){const z=states[s],r=z.r;let b=axes('Items bought / month','Spend ($ / month)',10,100);const origin=coords(...M.densityRows[5],10,100);
        if(z.kind==='radius'){b+=`<ellipse cx="${origin[0]}" cy="${origin[1]}" rx="${v.eps*r.sd[0]/10*660*t}" ry="${v.eps*r.sd[1]/100*280*t}" fill="none" stroke="${C.amber}" stroke-width="2" stroke-dasharray="5 4"/>`;r.near[5].forEach(i=>{const p=coords(...M.densityRows[i],10,100);b+=line(...origin,lerp(origin[0],p[0],t),lerp(origin[1],p[1],t),C.amber,2);});}
        if(z.kind==='group'){const group=Math.max(...z.labels.filter(Number.isInteger));r.near.forEach((near,i)=>{if(r.core[i]&&z.labels[i]===group)near.forEach(j=>{if(j<=i||z.labels[j]!==group)return;const a=coords(...M.densityRows[i],10,100),d=coords(...M.densityRows[j],10,100);b+=line(...a,lerp(a[0],d[0],t),lerp(a[1],d[1],t),palettes[group%palettes.length],2);});});}
        M.densityRows.forEach((p,i)=>{const [x,y]=coords(...p,10,100),g=z.labels?.[i],has=Number.isInteger(g)&&g>=0,col=has?palettes[g%palettes.length]:C.cyan;
          b+=circle(x,y,8,col);if((z.kind==='core'||z.labels)&&r.core[i])b+=`<circle cx="${x}" cy="${y}" r="13" fill="none" stroke="${col}" stroke-width="2" opacity="${z.kind==='core'?t:1}"/>`;
          if(z.kind==='done'&&g===-1)b+=`<path d="M${x-8} ${y-8}l16 16m-16 0l16-16" stroke="${C.ink}" stroke-width="2"/>`;else if(has)b+=txt(x,y-18,g+1,'mv-sub');});
        return svg(b,`DBSCAN. ${z.title}. ${z.result}.`);}
    },
    pca:{
      name:'PCA',subtitle:'Find a direction. Keep fewer coordinates.',context:'The same 12 invented customers as K-means · monthly items and spend ($).',type:'Live two-feature PCA · exact covariance eigendecomposition.',
      limit:'The first component maximizes variance in the prepared inputs. It does not use targets or prove that the representation is useful. Component signs can reverse without changing the subspace.',defaults:{scale:1},
      controls:v=>select('mv-scale','Preparation',[[1,'Center + standardize'],[0,'Center only']],v.scale),read:q=>({scale:+q('#mv-scale').value}),
      states(v){const r=M.pca(!!v.scale);return steps(['Center the measurements','Learn a new direction','Project onto one component','Read the retained variation'],[
        `Subtract training means: ${fmt(r.mu[0],2)} items and $${fmt(r.mu[1],2)}. ${v.scale?'Then divide by each feature SD; both axes are in SD units.':'Keep the original units. Spend now dominates the numerical variation.'}`,
        'The first principal component follows the direction with the most variance. This direction is learned from the prepared rows, not chosen by eye.',
        'Drop a perpendicular from every point to the learned axis. Keep its signed coordinate along that axis: two features become one component score.',
        'The projection discards variation perpendicular to the first component. Retained variance measures this representation, not prediction accuracy.'
      ],[v.scale?'Two standardized features':'Two centered features',`Direction = (${fmt(r.axis[0],3)}, ${fmt(r.axis[1],3)})`,`Customer 1: component score ${fmt(r.scores[0],2)}`,`${fmt(100*r.ratio,1)}% variance retained`]).map(z=>({...z,r}));},
      draw(v,s,t,states){const r=states[s].r,bound=Math.max(...r.x.flatMap(p=>p.map(Math.abs)))*1.2,scale=135/bound,origin=[400,190],pos=p=>[400+p[0]*scale,190-p[1]*scale];let b=line(220,190,580,190)+line(400,25,400,355)+txt(400,386,v.scale?'Centered and standardized items →':'Centered items (items / month) →','mv-sub')+txt(400,22,v.scale?'↑ Centered and standardized spend':'↑ Centered spend ($ / month)','mv-sub');
        [-1,1].forEach(sign=>{b+=txt(400+sign*135,212,fmt(sign*bound,1),'mv-tick')+txt(388,190-sign*135+5,fmt(sign*bound,1),'mv-tick','end');});
        if(s>=1){const angle=s===1?lerp(0,r.angle,t):r.angle,dir=[Math.cos(angle),Math.sin(angle)];b+=line(...pos(dir.map(n=>-bound*n*1.15)),...pos(dir.map(n=>bound*n*1.15)),C.mint,4)+txt(620,65,'PC1','mv-emphasis');}
        r.x.forEach((p,i)=>{const a=pos(p),dest=pos(r.projection[i]),u=s===2?t:s>2?1:0;if(s>=2){b+=circle(...a,5,C.muted)+line(...a,lerp(a[0],dest[0],u),lerp(a[1],dest[1],u),C.amber,1.5,'4 4');}b+=circle(lerp(a[0],dest[0],u),lerp(a[1],dest[1],u),7,C.cyan);});
        if(s===3)b+=txt(400,354,`${fmt(100*r.ratio,1)}% retained · ${fmt(100*(1-r.ratio),1)}% discarded`,'mv-emphasis');return svg(b,`PCA. ${states[s].title}. ${states[s].result}.`);}
    },
    isolation:{
      name:'Isolation Forest',subtitle:'Split at random. Count the path lengths.',context:'14 invented customers · monthly items and spend ($). Inspect one case across many trees.',type:'Live seeded isolation trees · all 14 rows per tree; depth limit 4.',
      limit:'Positive score = 2^(−mean corrected path / c(14)); higher is more unusual. c(14) is the expected path length for 14 rows. Leaf corrections use exact harmonic numbers. This teaching implementation is not scikit-learn; its score_samples uses the opposite sign. No score is a fraud probability.',defaults:{target:12,trees:32,seed:7,cutoff:.6},
      controls:v=>select('mv-case','Inspect customer',[[0,'1 · (1 item, $15)'],[12,'13 · (9 items, $10)'],[13,'14 · (0.3 items, $95)']],v.target)+select('mv-trees','Trees',[[16,16],[32,32]],v.trees)+select('mv-seed','Random splits',[[7,'Seed A'],[19,'Seed B']],v.seed)+select('mv-cutoff','Flag at score ≥',[[.5,'0.50'],[.6,'0.60'],[.7,'0.70']],v.cutoff),
      read:q=>({target:+q('#mv-case').value,trees:+q('#mv-trees').value,seed:+q('#mv-seed').value,cutoff:+q('#mv-cutoff').value}),
      states(v){const r=M.isolationForest(v.trees,v.seed),p=r.paths[v.target][0],score=r.scores[v.target];return [
        {kind:'data',title:'Select a case to inspect',text:'The outlined point is one customer. We fit random partitions without normal or abnormal labels.',result:`Customer ${v.target+1}: ${M.densityRows[v.target][0]} items · $${M.densityRows[v.target][1]}`,r,p},
        ...p.cuts.map((cut,i)=>({kind:'cut',depth:i+1,title:`Tree 1 · random split ${i+1}`,text:`Split ${cut.feature?'spend':'items'} at ${fmt(cut.cut,2)} ${cut.feature?'dollars':'items'}. Keep following the region containing the selected customer.`,result:`Follow the ${cut.left?'lower':'higher'} side`,r,p})),
        {kind:'leaf',title:'Measure this path',text:'Stop at a single case or the depth limit. If a leaf still contains several cases, add an expected-path correction.',result:`${p.cuts.length} splits + ${fmt(M.pathCorrection(p.leafSize),2)} correction = ${fmt(p.length,2)}`,r,p},
        {kind:'forest',title:'Average across random trees',text:'Each bar is a corrected path length for this customer in one tree. Shorter average paths produce a higher anomaly score.',result:`Mean path ${fmt(r.average[v.target],2)} → score ${fmt(score,3)}`,r,p},
        {kind:'decision',title:'Apply a separate cutoff',text:'The cutoff changes the review decision, not the fitted trees or scores. A flag means investigate; it does not establish fraud or an error.',result:`${fmt(score,3)} ${score>=v.cutoff?'≥':'<'} ${fmt(v.cutoff,2)} → ${score>=v.cutoff?'flag for review':'not flagged'}`,r,p}
      ];},
      draw(v,s,t,states){const z=states[s];let b='';
        if(z.kind==='forest'||z.kind==='decision'){const paths=z.r.paths[v.target],w=610/paths.length,max=Math.max(6,...paths.map(p=>p.length)),u=z.kind==='forest'?t:1;b=txt(75,35,'Corrected path length · one bar per tree','mv-axis','start')+line(75,300,735,300);[0,2,4,6].forEach(n=>b+=line(75,300-n/max*220,735,300-n/max*220)+txt(60,305-n/max*220,n,'mv-tick','end'));paths.forEach((p,i)=>{const h=p.length/max*220*u;b+=`<rect x="${85+i*w}" y="${300-h}" width="${w-3}" height="${h}" fill="${C.cyan}"/>`;});const y=300-z.r.average[v.target]/max*220;b+=line(75,y,735,y,C.amber,2,'5 4')+txt(400,340,`Mean path ${fmt(z.r.average[v.target],2)} · score ${fmt(z.r.scores[v.target],3)}`,'mv-emphasis');if(z.kind==='decision')b+=txt(400,385,z.result,'mv-node');
        }else{b=axes('Items bought / month','Spend ($ / month)',10,100);let bounds=[0,10,0,100];const depth=z.kind==='cut'?z.depth:z.kind==='leaf'?z.p.cuts.length:0;
          z.p.cuts.slice(0,depth).forEach((c,i)=>{const a=c.feature?coords(bounds[0],c.cut,10,100):coords(c.cut,bounds[2],10,100),d=c.feature?coords(bounds[1],c.cut,10,100):coords(c.cut,bounds[3],10,100),u=z.kind==='cut'&&i===depth-1?t:1;b+=line(...a,lerp(a[0],d[0],u),lerp(a[1],d[1],u),C.amber,3);if(c.feature){if(c.left)bounds[3]=c.cut;else bounds[2]=c.cut;}else{if(c.left)bounds[1]=c.cut;else bounds[0]=c.cut;}});
          const a=coords(bounds[0],bounds[3],10,100),d=coords(bounds[1],bounds[2],10,100);if(depth)b+=`<rect x="${a[0]}" y="${a[1]}" width="${d[0]-a[0]}" height="${d[1]-a[1]}" fill="${C.mint}" opacity=".1"/>`;
          M.densityRows.forEach((p,i)=>{const a=coords(...p,10,100);b+=circle(...a,7,i===v.target?C.amber:C.cyan);if(i===v.target)b+=`<circle cx="${a[0]}" cy="${a[1]}" r="14" fill="none" stroke="${C.ink}" stroke-width="2"/>`;});}
        return svg(b,`Isolation Forest. ${z.title}. ${z.result}.`);}
    }
  });

  const players=new Map();
  const namespace=(html,id)=>html.replace(/(id|for)="mv-/g,`$1="${id}-mv-`);
  function html(id){
    const a=specs[id];
    const transport=`<div class="mv-transport"><button id="mv-play">Play</button><button id="mv-back" aria-label="Previous animation step">← Step</button><button id="mv-forward" aria-label="Next animation step">Step →</button><button id="mv-reset">Reset</button><span id="mv-count"></span></div>`;
    const explanation=`<aside class="mv-explanation"><p class="eyebrow" id="mv-phase"></p><h3 id="mv-title"></h3><p id="mv-text"></p><div id="mv-result" role="status" aria-live="polite"></div></aside>`;
    const context=a.context?`<p class="mv-example">${a.context}</p>`:'';
    const notes=a.type||a.limit?`<details class="mv-details"><summary>About this example</summary><p>${a.type}</p><p>${a.limit}</p></details>`:'';
    return namespace(`<section class="model-cover walkthrough-cover${a.process?' process-cover':''}"><div class="mv-layout"><div class="mv-stage">${context}<div id="mv-drawing"></div></div><div class="process-sidebar">${transport}<div class="mv-options">${a.controls(a.defaults)}</div>${explanation}${notes}</div></div></section>`,id);
  }

  function mount(id,root){
    const q=s=>root.querySelector(s.replace(/#mv-/g,`#${id}-mv-`));
    players.get(id)?.dispose();const a=specs[id],media=matchMedia('(prefers-reduced-motion: reduce)');let values={...a.defaults},states=a.states(values),step=0,timer=0,raf=0,playing=false,disposed=false;
    function draw(t=1){if(!disposed){frameProgress=t;q('#mv-drawing').innerHTML=a.draw(values,step,t,states);}}
    function pause(){playing=false;cancelAnimationFrame(raf);raf=0;if(!disposed)draw();clearTimeout(timer);timer=0;if(!disposed&&q('#mv-play'))q('#mv-play').textContent=step===states.length-1?'Replay':'Play';}
    function update(animate=false){cancelAnimationFrame(raf);const r=states[step];q('#mv-title').textContent=r.title;q('#mv-text').textContent=r.text;q('#mv-result').textContent=r.result;q('#mv-phase').textContent=`Step ${step+1} · ${id==='kmeans'?'Grouping':id==='linear'&&step===1?'Fit':'How the output is produced'}`;q('#mv-count').textContent=`${step+1} / ${states.length}`;q('#mv-back').disabled=step===0;q('#mv-forward').disabled=step===states.length-1;if(q('#mv-steps')){q('#mv-steps').innerHTML=states.map((r,i)=>`<button type="button" aria-label="Step ${i+1}: ${r.title}" aria-current="${i===step?'step':'false'}" data-mv-step="${i}">${i+1}</button>`).join('');q('#mv-steps').querySelectorAll('button').forEach(b=>b.onclick=()=>{pause();step=+b.dataset.mvStep;update(true);});}
      if(q('#mv-motion'))q('#mv-motion').textContent=media.matches?'Reduced motion: no automatic playback or moving transitions. Use the step buttons.':a.process?'Plays once, then stops. Pause or use the step buttons to inspect each transition.':'Plays once, then stops. Pause to discuss a step. Changing an input restarts the example.';
      q('#mv-play').disabled=media.matches;
      q('.model-cover').dataset.step=step;q('.model-cover').dataset.model=id;q('.model-cover').dataset.steps=states.length;
      if(animate&&!media.matches){const start=performance.now();const frame=now=>{if(disposed)return;const t=Math.min(1,(now-start)/(a.transitionMs||1100));draw(t*t*(3-2*t));if(t<1)raf=requestAnimationFrame(frame);};draw(0);raf=requestAnimationFrame(frame);}else draw();
      if(!playing)q('#mv-play').textContent=step===states.length-1?'Replay':'Play';
    }
    function schedule(){clearTimeout(timer);timer=setTimeout(()=>{if(disposed||!playing)return;if(step<states.length-1){step++;update(true);}if(step===states.length-1){playing=false;q('#mv-play').textContent='Replay';}else schedule();},2300);}
    function play(){if(disposed||media.matches)return;if(playing){pause();return;}if(step===states.length-1){step=0;update();}playing=true;q('#mv-play').textContent='Pause';schedule();}
    q('#mv-play').onclick=play;q('#mv-back').onclick=()=>{pause();step=Math.max(0,step-1);update(true);};q('#mv-forward').onclick=()=>{pause();step=Math.min(states.length-1,step+1);update(true);};q('#mv-reset').onclick=()=>{pause();values={...a.defaults};q('.mv-options').innerHTML=namespace(a.controls(values),id);bindInputs();states=a.states(values);step=0;update();};
    function bindInputs(){q('.mv-options').querySelectorAll('select').forEach(e=>e.onchange=()=>{pause();values=a.read(q);states=a.states(values);step=0;update();});}bindInputs();
    const hide=()=>{if(document.hidden){pause();cancelAnimationFrame(raf);draw();}};
    const reduce=()=>{pause();update();};document.addEventListener('visibilitychange',hide);media.addEventListener('change',reduce);
    const player={pause,dispose(){pause();disposed=true;cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',hide);media.removeEventListener('change',reduce);players.delete(id);}};players.set(id,player);update();return()=>player.dispose();
  }
  // Small explanatory diagrams share one clock per scene and pause outside the viewport.
  const miniLabels={reduce:'Illustrative projection from two dimensions onto one axis.',unusual:'Illustrative partitions isolate an unusual point.',quantity:'Illustrative regression: 8 km gives an estimate of 26 minutes.',category:'Illustrative classification: a booking receives a predicted category.',groups:'Illustrative grouping: fixed observations are assigned to three groups.',learned:'Illustrative slope: each additional kilometre adds two minutes.',hyper:'Three nearest examples are selected around a new input.',prep:'Training distances 2, 4 and 6 km give a mean of 4 km.',threshold:'A probability is compared with a fixed threshold of 0.6.'};
  function mini(kind){return `<div class="mini-diagram" data-mini="${kind}"></div>`;}
  function miniControls(){return '<div class="mini-controls"><button type="button" data-mini-toggle>Pause animation</button></div>';}
  function drawMini(kind,p){
    const progress=Math.min(1,p*1.5),trace=(x1,y1,x2,y2,u=progress,color=C.mint)=>line(x1,y1,lerp(x1,x2,u),lerp(y1,y2,u),color,3);
    let b='';
    if(kind==='quantity'||kind==='learned'){
      b=line(45,145,310,145,C.muted,1)+line(45,145,45,25,C.muted,1)+txt(305,172,'km','mv-sub')+txt(45,17,'min','mv-sub');
      [[2,14],[4,18],[6,22]].forEach(([x,y])=>b+=circle(45+x*28,145-y*3.7,5,C.cyan));
      b+=trace(45,108,297,41.4,Math.min(1,progress*2));
      if(kind==='quantity'){
        const u=Math.max(0,progress*2-1);b+=line(269,145,269,48.8,C.line,1,'4 5')+circle(269,lerp(145,48.8,u),7,C.amber)+txt(269,32,'26 min','mv-emphasis')+txt(269,160,'8','mv-sub');
      }else{
        b+=trace(157,78.4,185,78.4,Math.min(1,progress*2),C.amber)+trace(185,78.4,185,71,Math.max(0,progress*2-1),C.amber)+txt(168,123,'+1 km','mv-sub')+txt(233,97,'+2 min','mv-sub');
      }
    }else if(kind==='category'){
      b+=`<rect x="211" y="33" width="126" height="45" rx="8" fill="${C.panel}" stroke="${C.mint}"/><rect x="211" y="111" width="126" height="45" rx="8" fill="none" stroke="${C.line}"/>`;
      b+=txt(274,61,'Missed visit','mv-sub')+txt(274,139,'Attended','mv-sub')+line(57,95,211,55,C.line)+line(57,95,211,133,C.line)+circle(lerp(57,211,progress),lerp(95,55,progress),7,C.mint)+txt(62,142,'New booking','mv-sub');
    }else if(kind==='groups'){
      const centers=[[82,70],[255,63],[180,140]],offsets=[[-24,-12],[15,-19],[23,15],[-16,19]];
      centers.forEach(([x,y],i)=>{b+=`<circle cx="${x}" cy="${y}" r="42" fill="none" stroke="${palettes[i]}" opacity="${progress*.7}" stroke-dasharray="4 5"/>`;offsets.forEach(([dx,dy],j)=>{b+=circle(x+dx,y+dy,6,progress>(j+1)/7?palettes[i]:C.muted);});b+=`<g opacity="${progress}">`+txt(x,y+5,i+1,'mv-sub')+'</g>';});
    }else if(kind==='hyper'){
      const points=[[149,62],[219,71],[180,125],[59,45],[293,41],[302,145]];
      b+=`<ellipse cx="180" cy="90" rx="57" ry="49" fill="none" stroke="${C.line}" stroke-dasharray="5 5"/>`;
      points.forEach(([x,y],i)=>{const u=Math.max(0,Math.min(1,progress*3-i));if(i<3)b+=trace(180,90,x,y,u);b+=circle(x,y,6,i<3?C.cyan:C.muted);});
      b+=diamond(180,90,8)+txt(50,167,'k = 3','mv-emphasis','start')+txt(212,167,'◇ new input','mv-sub');
    }else if(kind==='prep'){
      b+=line(60,125,300,125,C.muted);[2,4,6].forEach((n,i)=>{const x=70+i*110;b+=circle(x,125,6,C.cyan)+txt(x,151,n,'mv-sub')+line(x,118,180,55,C.line,1)+circle(lerp(x,180,progress),lerp(118,55,progress),5,C.mint);});
      b+=txt(180,28,'(2 + 4 + 6) / 3 = 4 km','mv-emphasis')+txt(315,151,'km','mv-sub');
    }else if(kind==='reduce'){
      b+=line(40,145,320,40,C.mint,3);[[70,105],[110,130],[155,65],[190,100],[245,40],[285,75]].forEach(([x,y])=>{const dx=280,dy=-105,u=((x-40)*dx+(y-145)*dy)/(dx*dx+dy*dy),a=40+u*dx,z=145+u*dy;b+=line(x,y,a,z,C.muted,1,'3 3')+circle(lerp(x,a,progress),lerp(y,z,progress),8,C.cyan);});
    }else if(kind==='unusual'){
      [[55,110],[80,130],[95,85],[110,110],[140,90],[155,125]].forEach(([x,y])=>b+=circle(x,y,8,C.cyan));b+=circle(290,50,9,C.amber)+line(220,20,220,20+145*progress,C.mint,3);if(progress>.6)b+=`<circle cx="290" cy="50" r="20" fill="none" stroke="${C.amber}" stroke-width="2"/>`;
    }else if(kind==='threshold'){
      const probability=Math.round((.3+.4*progress)*100)/100,x=40+probability*280;b+=line(40,125,320,125,C.muted)+line(208,50,208,145,C.muted,2,'4 4')+line(208,125,320,125,C.mint,3)+circle(x,125,7,probability>=.6?C.mint:C.cyan)+txt(40,150,'0','mv-sub')+txt(208,166,'0.6','mv-sub')+txt(320,150,'1','mv-sub')+txt(180,28,`p = ${fmt(probability,2)} → ${probability>=.6?'flag':'no flag'}`,'mv-emphasis')+txt(100,82,'No flag','mv-sub')+txt(266,82,'Flag','mv-sub');
    }
    return `<svg viewBox="0 0 360 185" role="img" aria-label="${miniLabels[kind]}">${b}</svg>`;
  }
  function mountMini(root){
    const media=matchMedia('(prefers-reduced-motion: reduce)'),button=root.querySelector('[data-mini-toggle]');let running=true,visible=false,raf=0,last=0,elapsed=0;
    const draw=p=>root.querySelectorAll('[data-mini]').forEach(el=>el.innerHTML=drawMini(el.dataset.mini,p));
    function frame(now){if(!visible||!running||media.matches||document.hidden){raf=0;return;}if(last)elapsed+=Math.min(80,now-last);last=now;draw(Math.min(1,(elapsed%7000)/4500));raf=requestAnimationFrame(frame);}
    function sync(){cancelAnimationFrame(raf);raf=0;last=0;button.disabled=media.matches;button.textContent=media.matches?'Reduced motion':running?'Pause animation':'Play animation';button.setAttribute('aria-pressed',String(running&&!media.matches));if(media.matches)draw(1);else if(visible&&running&&!document.hidden)raf=requestAnimationFrame(frame);}
    button.onclick=()=>{running=!running;sync();};const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.12});io.observe(root);
    document.addEventListener('visibilitychange',sync);media.addEventListener('change',sync);draw(media.matches?1:0);sync();
    addEventListener('pagehide',()=>{cancelAnimationFrame(raf);io.disconnect();document.removeEventListener('visibilitychange',sync);media.removeEventListener('change',sync);},{once:true});
  }

  return {mini,miniControls,mountMini,html,mount,pause:()=>players.forEach(p=>p.pause()),pauseModel:id=>players.get(id)?.pause(),dispose:()=>[...players.values()].forEach(p=>p.dispose()),specs,clusterTrace};
})();
