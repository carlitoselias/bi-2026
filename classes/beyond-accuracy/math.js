/* Pure teaching calculations. No fitting, network calls or student data. */
(function(root){
  'use strict';
  const ratio=(n,d)=>d?n/d:null;
  function confusion(rows,t=.5,key='a'){
    const c={tp:0,fp:0,fn:0,tn:0,n:rows.length};
    for(const r of rows)c[r.y?(r[key]>=t?'tp':'fn'):(r[key]>=t?'fp':'tn')]++;
    return {...c,positive:c.tp+c.fn,alerts:c.tp+c.fp,accuracy:ratio(c.tp+c.tn,c.n),precision:ratio(c.tp,c.tp+c.fp),recall:ratio(c.tp,c.tp+c.fn),specificity:ratio(c.tn,c.tn+c.fp),fpr:ratio(c.fp,c.fp+c.tn),f1:ratio(2*c.tp,2*c.tp+c.fp+c.fn)};
  }
  function curves(rows,key='a'){
    const thresholds=[Infinity,...new Set(rows.map(r=>r[key]).sort((a,b)=>b-a))];
    const points=thresholds.map(t=>({...confusion(rows,t,key),t}));
    if(!rows.some(r=>r.y)||!rows.some(r=>!r.y))return {points,roc:null,pr:null,ap:null};
    let roc=0,pr=0,ap=0;
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],delta=b.recall-a.recall;
      roc+=(b.fpr-a.fpr)*(a.recall+b.recall)/2;
      // Precision=1 at recall=0 is a plotting convention, not measured precision.
      pr+=delta*((a.precision??1)+b.precision)/2;
      ap+=delta*b.precision;
    }
    return {points,roc,pr,ap};
  }
  function probability(p,mode){
    if(mode==='extreme')return p*p/(p*p+(1-p)*(1-p));
    if(mode==='soft')return .5+(p-.5)*.5;
    return p;
  }
  function calibration(rows,mode='original',count=5,key='a'){
    const bins=Array.from({length:count},(_,i)=>({lo:i/count,hi:(i+1)/count,n:0,sum:0,positives:0}));
    let brier=0;
    for(const r of rows){const p=probability(r[key],mode),b=bins[Math.min(count-1,Math.floor(p*count))];b.n++;b.sum+=p;b.positives+=r.y;brier+=(p-r.y)**2;}
    return {bins:bins.map(b=>({...b,mean:ratio(b.sum,b.n),rate:ratio(b.positives,b.n)})),brier:ratio(brier,rows.length)};
  }
  function population(prevalence,tpr,fpr,n=10000){
    const tp=n*prevalence*tpr,fn=n*prevalence*(1-tpr),fp=n*(1-prevalence)*fpr,tn=n*(1-prevalence)*(1-fpr);
    return {tp,fn,fp,tn,n,alerts:tp+fp,precision:ratio(tp,tp+fp),recall:tpr,fpr};
  }
  function ranking(rows,key='a'){
    let wins=0,ties=0,total=0;
    for(const p of rows.filter(r=>r.y))for(const n of rows.filter(r=>!r.y)){total++;if(p[key]>n[key])wins++;else if(p[key]===n[key])ties++;}
    return {wins,ties,total,auc:ratio(wins+.5*ties,total)};
  }
  function capacity(rows,limit,key='a'){
    // A score threshold cannot split a tied group without a separate tie rule.
    return curves(rows,key).points.filter(p=>p.alerts<=limit).at(-1);
  }
  const api={confusion,curves,calibration,probability,population,ranking,capacity};
  if(typeof module!=='undefined')module.exports=api;else root.ClassificationMath=api;
})(typeof globalThis!=='undefined'?globalThis:this);
