/* Original teaching data. No personal or external dataset is distributed. */
window.LabMath = (()=>{
 const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
 const mae=(y,p)=>mean(y.map((v,i)=>Math.abs(v-p[i])));
 const rmse=(y,p)=>Math.sqrt(mean(y.map((v,i)=>(v-p[i])**2)));
 const training=[[1,12],[2,16],[3,13],[4,23],[5,19],[6,28],[7,23],[8,34],[9,29],[10,39],[11,34],[12,44]];
 const validation=[[1.5,13],[3.5,18],[5.5,22],[7.5,28],[9.5,33],[11.5,39]];
 function knn(rows,x,k,weighted=false){const near=rows.map((r,i)=>({x:r[0],y:r[1],d:Math.abs(r[0]-x),i})).sort((a,b)=>Math.abs(a.d-b.d)<1e-12?a.i-b.i:a.d-b.d).slice(0,k);const exact=near.filter(v=>v.d===0);return exact.length&&weighted?mean(exact.map(v=>v.y)):weighted?near.reduce((s,v)=>s+v.y/v.d,0)/near.reduce((s,v)=>s+1/v.d,0):mean(near.map(v=>v.y));}
 function linear(rows){const x=mean(rows.map(r=>r[0])),y=mean(rows.map(r=>r[1]));const b=rows.reduce((s,r)=>s+(r[0]-x)*(r[1]-y),0)/rows.reduce((s,r)=>s+(r[0]-x)**2,0);return {b,a:y-b*x};}
 function confusion(prob,labels,t){let tp=0,tn=0,fp=0,fn=0;prob.forEach((p,i)=>{if(p>=t){labels[i]?tp++:fp++;}else{labels[i]?fn++:tn++;}});return {tp,tn,fp,fn,precision:tp+fp?tp/(tp+fp):null,recall:tp+fn?tp/(tp+fn):null,f1:2*tp+fp+fn?2*tp/(2*tp+fp+fn):null,accuracy:(tp+tn)/labels.length};}
 const clinic={prob:[.91,.78,.62,.55,.48,.42,.33,.26,.18,.08],y:[1,0,1,0,1,0,0,0,0,0]};
 const shops=[[1,15],[2,20],[2,12],[3,22],[6,65],[7,70],[8,62],[8,80],[3,72],[4,78],[4,64],[5,85]];
 function kmeans(k,scale=true,seed=0){const means=[0,1].map(j=>mean(shops.map(r=>r[j])));const sd=[0,1].map(j=>Math.sqrt(mean(shops.map(r=>(r[j]-means[j])**2))));const x=shops.map(r=>r.map((v,j)=>scale?(v-means[j])/sd[j]:v));const starts=seed?[2,7,10,0]:[0,4,8,11];let centers=starts.slice(0,k).map(i=>x[i].slice()),labels=[],iterations=0;for(let it=0;it<100;it++){labels=x.map(r=>centers.map(c=>r.reduce((s,v,j)=>s+(v-c[j])**2,0)).reduce((best,v,j,a)=>v<a[best]?j:best,0));const next=centers.map((c,h)=>{const group=x.filter((_,i)=>labels[i]===h);return group.length?[0,1].map(j=>mean(group.map(r=>r[j]))):c;});iterations=it+1;const diff=next.reduce((s,c,i)=>s+c.reduce((u,v,j)=>u+(v-centers[i][j])**2,0),0);centers=next;if(diff<1e-12)break;}
 labels=x.map(r=>centers.map(c=>r.reduce((s,v,j)=>s+(v-c[j])**2,0)).reduce((best,v,j,a)=>v<a[best]?j:best,0));const inertia=x.reduce((s,r,i)=>s+r.reduce((v,n,j)=>v+(n-centers[labels[i]][j])**2,0),0);return {labels,centers:centers.map(c=>c.map((v,j)=>scale?v*sd[j]+means[j]:v)),inertia,iterations};}
 function cv(k,weighted){const folds=[[],[],[]];training.forEach((r,i)=>folds[i%3].push(r));return folds.map((val,f)=>{const train=training.filter((_,i)=>i%3!==f);return mae(val.map(r=>r[1]),val.map(r=>knn(train,r[0],k,weighted)));});}
 const housing=[];[40,60,80].forEach(area=>[2,5,8].forEach(distance=>housing.push([area,distance,40+2*area-3*distance])));
 function ols2(rows){const A=Array.from({length:3},()=>[0,0,0,0]);rows.forEach(r=>{const x=[1,r[0],r[1]];x.forEach((v,i)=>{x.forEach((u,j)=>A[i][j]+=v*u);A[i][3]+=v*r[2];});});for(let i=0;i<3;i++){let p=i;for(let j=i+1;j<3;j++)if(Math.abs(A[j][i])>Math.abs(A[p][i]))p=j;[A[i],A[p]]=[A[p],A[i]];const div=A[i][i];for(let j=i;j<4;j++)A[i][j]/=div;for(let h=0;h<3;h++)if(h!==i){const f=A[h][i];for(let j=i;j<4;j++)A[h][j]-=f*A[i][j];}}return A.map(r=>r[3]);}
 const coef=ols2(housing),background=[mean(housing.map(r=>r[0])),mean(housing.map(r=>r[1]))];
 function shap(x){const base=coef[0]+coef[1]*background[0]+coef[2]*background[1];const values=x.map((v,j)=>coef[j+1]*(v-background[j]));return {base,values,prediction:base+values.reduce((s,v)=>s+v,0)};}
 // Small synthetic examples, computed in the browser. No external ML runtime.
 const densityRows=[...shops.map(r=>r.slice()),[9,10],[.3,95]];
 function prepare(rows,scale=true){
  const mu=[0,1].map(j=>mean(rows.map(r=>r[j])));
  const sd=[0,1].map(j=>Math.sqrt(mean(rows.map(r=>(r[j]-mu[j])**2)))||1);
  return {mu,sd,x:rows.map(r=>r.map((v,j)=>(v-mu[j])/(scale?sd[j]:1)))};
 }
 function dbscan(eps=.65,minPts=3,rows=densityRows){
  const prep=prepare(rows),x=prep.x;
  const near=x.map(p=>x.flatMap((q,j)=>Math.hypot(p[0]-q[0],p[1]-q[1])<=eps+1e-12?[j]:[]));
  const core=near.map(a=>a.length>=minPts),labels=rows.map(()=>null),visited=new Set(),trace=[];
  let groups=0;
  for(let i=0;i<x.length;i++){
   if(visited.has(i))continue;visited.add(i);
   if(!core[i]){labels[i]=-1;continue;}
   const id=groups++,queue=[...near[i]],queued=new Set(queue);labels[i]=id;
   for(let h=0;h<queue.length;h++){
    const j=queue[h];
    if(!visited.has(j)){visited.add(j);if(core[j])for(const n of near[j])if(!queued.has(n)){queue.push(n);queued.add(n);}}
    if(labels[j]===null||labels[j]===-1)labels[j]=id;
   }
   trace.push({labels:labels.slice(),group:id});
  }
  return {...prep,near,core,labels,trace,groups,noise:labels.filter(v=>v===-1).length};
 }
 function pca(scale=true,rows=shops){
  const prep=prepare(rows,scale),x=prep.x,n=x.length;
  const a=x.reduce((s,r)=>s+r[0]**2,0)/(n-1),b=x.reduce((s,r)=>s+r[0]*r[1],0)/(n-1),d=x.reduce((s,r)=>s+r[1]**2,0)/(n-1);
  const angle=.5*Math.atan2(2*b,a-d),axis=[Math.cos(angle),Math.sin(angle)];
  const root=Math.hypot(a-d,2*b),eigenvalues=[(a+d+root)/2,(a+d-root)/2];
  const scores=x.map(r=>r[0]*axis[0]+r[1]*axis[1]),projection=scores.map(s=>axis.map(v=>v*s));
  const mse=mean(x.map((r,i)=>r.reduce((s,v,j)=>s+(v-projection[i][j])**2,0)));
  return {...prep,axis,angle,eigenvalues,scores,projection,mse,ratio:eigenvalues[0]/(a+d)};
 }
 function pathCorrection(n){if(n<=1)return 0;let h=0;for(let i=1;i<n;i++)h+=1/i;return 2*h-2*(n-1)/n;}
 function isolationForest(trees=32,seed=7,rows=densityRows){
  let state=seed>>>0;const random=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return (state+.5)/4294967296;};
  const depthLimit=Math.ceil(Math.log2(rows.length));
  function build(ids,depth){
   const dims=[0,1].filter(j=>Math.max(...ids.map(i=>rows[i][j]))>Math.min(...ids.map(i=>rows[i][j])));
   if(ids.length<=1||depth>=depthLimit||!dims.length)return {size:ids.length};
   const feature=dims[Math.floor(random()*dims.length)],lo=Math.min(...ids.map(i=>rows[i][feature])),hi=Math.max(...ids.map(i=>rows[i][feature]));
   const cut=lo+(hi-lo)*random(),left=ids.filter(i=>rows[i][feature]<cut),right=ids.filter(i=>rows[i][feature]>=cut);
   return {feature,cut,size:ids.length,left:build(left,depth+1),right:build(right,depth+1)};
  }
  const forest=Array.from({length:trees},()=>build(rows.map((_,i)=>i),0));
  function path(tree,row){let node=tree,depth=0;const cuts=[];while(node.left){const left=row[node.feature]<node.cut;cuts.push({feature:node.feature,cut:node.cut,left});node=left?node.left:node.right;depth++;}
   return {cuts,leafSize:node.size,length:depth+pathCorrection(node.size)};
  }
  const paths=rows.map(row=>forest.map(tree=>path(tree,row))),average=paths.map(a=>mean(a.map(p=>p.length)));
  return {paths,average,scores:average.map(h=>2**(-h/pathCorrection(rows.length))),depthLimit};
 }
 return {mean,mae,rmse,knn,linear,training,validation,confusion,clinic,shops,kmeans,cv,housing,coef,background,shap,prepare,densityRows,dbscan,pca,isolationForest,pathCorrection};
})();
