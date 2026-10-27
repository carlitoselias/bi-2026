/* Authored illustrative dispatch records, fixed and reproducible. No real company. */
(function(root){
  function make(test=false){
    const positive=new Set(test?[4,12,21,30,40,49,58,66,75,81,89,97]:[3,13,24,34,45,55,66,76,87,97]);
    return Array.from({length:100},(_,i)=>{
      const y=+positive.has(i),rank=[...positive].indexOf(i);
      const a=y?(test?[.12,.21,.29,.35,.43,.51,.59,.65,.71,.78,.86,.93][rank]:[.18,.28,.38,.48,.58,.68,.75,.82,.88,.94][rank]):.02+((i*37+(test?13:0))%91)/100*(i%8===0?.85:.42);
      const b=y?Math.min(.97,.22+((rank*7+4)%12)*.062):.01+((i*29+(test?21:0))%95)/100*(i%6===0?.90:.29);
      return {id:(test?'T':'D')+String(i+1).padStart(3,'0'),y,a:+a.toFixed(4),b:+b.toFixed(4)};
    });
  }
  const api={validation:make(),test:make(true),provenance:'Authored classroom simulation; 100 validation deliveries and 100 separate test deliveries. Scores are fixed illustrative outputs, not fitted models. No real dates, company records or causal claims.'};
  if(typeof module!=='undefined')module.exports=api;else root.DeliveryData=api;
})(typeof globalThis!=='undefined'?globalThis:this);
