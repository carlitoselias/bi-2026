/* Small, transparent calculations used by the live country experiments. */
(function(root) {
  'use strict';
  function mean(values) { return values.reduce((a,b)=>a+b,0)/values.length; }
  function linear(points) {
    const mx=mean(points.map(p=>p.x)), my=mean(points.map(p=>p.y));
    const denominator=points.reduce((s,p)=>s+(p.x-mx)**2,0);
    const slope=denominator ? points.reduce((s,p)=>s+(p.x-mx)*(p.y-my),0)/denominator : 0;
    return {slope,intercept:my-slope*mx};
  }
  function predict(model,x) { return model.intercept+model.slope*x; }
  function knn(points,x,k) {
    const neighbors=points.map((p,i)=>({...p,i,d:Math.abs(p.x-x)})).sort((a,b)=>a.d-b.d||a.i-b.i).slice(0,k);
    return {value:mean(neighbors.map(p=>p.y)),neighbors};
  }
  function errors(actual,predicted) {
    const residuals=actual.map((y,i)=>y-predicted[i]);
    return {residuals,mae:mean(residuals.map(Math.abs)),rmse:Math.sqrt(mean(residuals.map(e=>e*e)))};
  }
  const api={mean,linear,predict,knn,errors};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  else root.ML=api;
})(typeof window!=='undefined'?window:this);
