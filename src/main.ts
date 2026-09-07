import './style.css';
import { RelativisticRenderer, type Quality } from './renderer/webgl';
import { bilinear, lower, raise, schwarzschildKSCovariant } from './physics/metric';
import { constraintDrift, rk4Step, type WorldlineState } from './physics/integrator';
import { buildTetrad, staticObserverVelocity } from './physics/tetrad';
import { geometricToKm, massTimeSeconds } from './physics/units';
import { properHoverAcceleration, radialTidalAcceleration } from './physics/observables';
import { pulseArrivalTime, receivedFrequencyRatio, type Pulse } from './physics/signals';
import type { Vec3, Vec4 } from './physics/types';

type ScenarioKey='sgr'|'stellar'|'hundred'|'m87'|'photon'|'isco'|'hover';
interface Scenario { name:string; mass:number; r:number; timeExp:number; }
const scenarios:Record<ScenarioKey,Scenario>={
  sgr:{name:'Sagittarius A*',mass:4.30e6,r:8,timeExp:1}, stellar:{name:'Stellar',mass:10,r:12,timeExp:-3}, hundred:{name:'Intermediate',mass:100,r:12,timeExp:-2},
  m87:{name:'M87*',mass:6.5e9,r:10,timeExp:2}, photon:{name:'Photon sphere',mass:4.30e6,r:3,timeExp:0}, isco:{name:'ISCO',mass:4.30e6,r:6,timeExp:0}, hover:{name:'Near horizon',mass:4.30e6,r:2.15,timeExp:-1},
};
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const canvas=$<HTMLCanvasElement>('spacetime');
let renderer:RelativisticRenderer;
try{renderer=new RelativisticRenderer(canvas)}catch(error){$('unsupported').hidden=false;throw error}

let scenarioKey:ScenarioKey='sgr', entity:'probe'|'astronaut'='probe', quality:Quality='medium', mode:'station'|'freefall'='station';
let paused=false,timeExp=0,yaw=0,pitch=0,dragging=false,lastPointer:[number,number]=[0,0],debug=0;
let state:WorldlineState; let tetrad:[Vec4,Vec4,Vec4,Vec4]; let pulses:Pulse[]=[]; let nextPulseSecond=1; let lastFrame=performance.now(); let toastTimer=0;

function reset(){
  const s=scenarios[scenarioKey]; const x:Vec3=[s.r,0,0]; const u=staticObserverVelocity(x); state={t:0,tau:0,x,p:lower(x,u)};tetrad=buildTetrad(x,u);mode=scenarioKey==='sgr'?'freefall':'station';pulses=[];nextPulseSecond=1;timeExp=s.timeExp;yaw=0;pitch=0;
  $<HTMLInputElement>('time-rate').value=String(timeExp); updateRateLabel(); drawSignals();
}
function rate(){return 10**timeExp}
function updateRateLabel(){$('time-rate-label').textContent=`${rate().toLocaleString()}×`}
function formatDistance(km:number){if(km>=1e9)return `${(km/1e9).toFixed(2)} billion km`;if(km>=1e6)return `${(km/1e6).toFixed(2)} million km`;return `${km.toLocaleString(undefined,{maximumFractionDigits:1})} km`}
function formatAccel(a:number){if(!Number.isFinite(a))return 'DIVERGES';if(a<.01)return `${a.toExponential(2)} m/s²`;return `${a.toLocaleString(undefined,{maximumFractionDigits:2})} m/s²`}
function observerVelocity():Vec4{return raise(state.x,state.p)}
function localSpeed():number|null{
  const r=Math.hypot(...state.x);if(r<=2)return null;const g=schwarzschildKSCovariant(state.x);const gamma=-bilinear(g,observerVelocity(),staticObserverVelocity(state.x));return Math.sqrt(Math.max(0,1-1/(gamma*gamma)));
}
function dismissMission(){ $('mission-card').classList.add('dismissed') }
function toast(message:string){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>el.classList.remove('show'),1800)}

function setStation(){
  const r=Math.hypot(...state.x);if(r<=2){toast('Station keeping is causally impossible inside the horizon');return}const u=staticObserverVelocity(state.x);state.p=lower(state.x,u);mode='station';toast('Proper acceleration applied: station keeping');
}
function release(){mode='freefall';toast('Engine cutoff — timelike geodesic')}
function thrust(axis:'forward'|'back'|'left'|'right'){
  const u=observerVelocity();tetrad=buildTetrad(state.x,u);const sign=axis==='forward'||axis==='left'?-1:1;const e=axis==='forward'||axis==='back'?tetrad[1]:tetrad[2];const rapidity=.015*sign;const boosted=u.map((v,i)=>Math.cosh(rapidity)*v+Math.sinh(rapidity)*e[i]!) as Vec4;state.p=lower(state.x,boosted);mode='freefall';toast(`0.015 rad local ${entity} impulse`);
}
function integrate(deltaSeconds:number){
  const s=scenarios[scenarioKey],mt=massTimeSeconds(s.mass),physical=deltaSeconds*rate();
  if(mode==='station'){
    const u=staticObserverVelocity(state.x);state.t+=physical/mt*u[0];state.tau+=physical/mt;state.p=lower(state.x,u);return;
  }
  let remaining=physical/mt,steps=0;
  while(remaining>0&&steps<5000){const r=Math.hypot(...state.x);if(r<.16){paused=true;toast('Classical model ended before the singularity');break}const h=Math.min(remaining,.018*Math.max(r,.35));state=rk4Step(state,h);remaining-=h;steps++;}
  if(remaining>0){paused=true;toast('Paused: integration budget exceeded at this time rate')}
  const physicalTau=state.tau*mt;
  while(physicalTau>=nextPulseSecond){const r=Math.hypot(...state.x);const arrival=pulseArrivalTime(state.t,r,80);pulses.push({sequence:pulses.length+1,emittedTau:nextPulseSecond,emittedKS:state.t,emittedR:r,arrivalSchwarzschildTime:arrival});nextPulseSecond++;if(pulses.length>80)pulses.shift()}
}
function explanation(){
  const r=Math.hypot(...state.x);if(r<.16)return 'The curvature is approaching the classical singularity. General relativity predicts geodesic incompleteness here, but not a trustworthy account of what happens at the singularity. The simulation stops before claiming unknown physics.';
  if(r<2)return 'You have crossed the event horizon. No wall appeared because the horizon is a causal boundary, not a material surface. Every future-directed path now reaches smaller areal radius; outward-looking light can still show parts of the external universe, but no new signal you emit can reach the distant receiver.';
  if(r<3)return 'You are inside the photon sphere but outside the horizon. The escape cone is narrow: only a shrinking set of outward photon directions can reach infinity. The dark region is made of traced photon trajectories that do not reach the celestial sphere.';
  if(mode==='station')return 'You are not in free fall. The simulator is applying the displayed proper acceleration to hold constant areal radius. That requirement diverges as r approaches 2M, so station keeping is disabled at and inside the horizon.';
  return 'Your engines are off. The observer follows a timelike geodesic and carries a local orthonormal frame. The sky is obtained by tracing arriving null directions backward through the Schwarzschild metric to the procedural celestial sphere.';
}
function updateHUD(){
  const s=scenarios[scenarioKey],r=Math.hypot(...state.x),mt=massTimeSeconds(s.mass),v=localSpeed(),tide=radialTidalAcceleration(s.mass,r),hover=properHoverAcceleration(s.mass,r);
  $('proper-time').textContent=`${(state.tau*mt).toFixed(3)} s`;$('worldline').textContent=mode==='station'?'THRUSTING · HOLD':'FREE FALL';$('radius').textContent=`${r.toFixed(3)} M`;$('horizon').textContent=r>2?'OUTSIDE':r>.16?'CROSSED':'MODEL ENDS';$('speed').textContent=v==null?'not defined':`${v.toFixed(4)} c`;
  $('mass').textContent=s.mass>=1e6?`${(s.mass/1e6).toFixed(2)} × 10⁶ M☉`:`${s.mass.toLocaleString()} M☉`;$('rs-ratio').textContent=(r/2).toFixed(4);$('radius-km').textContent=formatDistance(geometricToKm(r,s.mass));$('hover-a').textContent=formatAccel(hover);$('tide').textContent=formatAccel(tide);$('drift').textContent=constraintDrift(state).toExponential(2);$('explanation').textContent=explanation();
  const last=pulses.at(-1),prev=pulses.at(-2),ratio=last&&prev?receivedFrequencyRatio(prev,last):null;$('pulse-id').textContent=last?`#${last.sequence}${last.arrivalSchwarzschildTime==null?' · trapped':''}`:'—';$('frequency').textContent=ratio==null?'—':ratio.toExponential(3);$('delay').textContent=last?.arrivalSchwarzschildTime==null?'∞ / no arrival':last?`${Math.max(0,(last.arrivalSchwarzschildTime-last.emittedKS)*mt).toFixed(2)} s`:'—';
}
function drawSignals(){
  const c=$<HTMLCanvasElement>('signal-chart'),ctx=c.getContext('2d')!;ctx.clearRect(0,0,c.width,c.height);ctx.strokeStyle='rgba(139,229,240,.18)';ctx.beginPath();for(let x=0;x<c.width;x+=52){ctx.moveTo(x,0);ctx.lineTo(x,c.height)}for(let y=0;y<c.height;y+=45){ctx.moveTo(0,y);ctx.lineTo(c.width,y)}ctx.stroke();if(pulses.length<2)return;
  const finite=pulses.filter(p=>p.arrivalSchwarzschildTime!=null);if(!finite.length)return;const min=finite[0]!.arrivalSchwarzschildTime!,max=finite.at(-1)!.arrivalSchwarzschildTime!;ctx.fillStyle='#8be5f0';for(const p of finite){const x=14+(p.arrivalSchwarzschildTime!-min)/Math.max(1,max-min)*(c.width-28);const y=c.height-16-(p.emittedTau/Math.max(1,pulses.at(-1)!.emittedTau))*(c.height-32);ctx.fillRect(x-1,y-6,2,12)}ctx.fillStyle='#82979e';ctx.font='12px system-ui';ctx.fillText('arrival time → (spacing grows as redshift increases)',12,17);
}
function frame(now:number){const dt=Math.min(.05,(now-lastFrame)/1000);lastFrame=now;if(!paused)integrate(dt);try{tetrad=buildTetrad(state.x,observerVelocity())}catch{paused=true}renderer.render({camera:state.x,tetrad,yaw,pitch,quality,debug});updateHUD();if(pulses.length)drawSignals();requestAnimationFrame(frame)}

canvas.addEventListener('pointerdown',e=>{dismissMission();dragging=true;lastPointer=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!dragging)return;yaw-=(e.clientX-lastPointer[0])*.004;pitch=Math.max(-1.45,Math.min(1.45,pitch-(e.clientY-lastPointer[1])*.004));lastPointer=[e.clientX,e.clientY]});canvas.addEventListener('pointerup',()=>dragging=false);
window.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)return;dismissMission();if(e.code==='Space'){paused=!paused;e.preventDefault()}if(e.key==='w')thrust('forward');if(e.key==='s')thrust('back');if(e.key==='a')thrust('left');if(e.key==='d')thrust('right');if(e.key==='f')release();if(e.key==='h')setStation();if(e.key==='g'){debug=(debug+1)%3;toast(debug===0?'Physical image':debug===1?'Debug: integration steps':'Debug: Hamiltonian drift')}});
$('panel-toggle').onclick=()=>$('science-panel').classList.add('open');$('panel-close').onclick=()=>$('science-panel').classList.remove('open');$('pause').onclick=()=>paused=!paused;$('step').onclick=()=>{paused=true;integrate(1/60)};$('reset').onclick=reset;$('release').onclick=release;$('stabilize').onclick=setStation;$('dual-toggle').onclick=()=>$('dual-panel').classList.add('open');$('dual-close').onclick=()=>$('dual-panel').classList.remove('open');
$<HTMLSelectElement>('scenario').onchange=e=>{scenarioKey=(e.target as HTMLSelectElement).value as ScenarioKey;reset()};$<HTMLSelectElement>('quality').onchange=e=>quality=(e.target as HTMLSelectElement).value as Quality;$<HTMLInputElement>('time-rate').oninput=e=>{timeExp=Number((e.target as HTMLInputElement).value);updateRateLabel()};
document.querySelectorAll<HTMLButtonElement>('[data-entity]').forEach(b=>b.onclick=()=>{entity=b.dataset.entity as typeof entity;document.querySelectorAll('[data-entity]').forEach(x=>x.classList.toggle('active',x===b));toast(`${entity==='probe'?'Probe':'Astronaut'} scale selected`)});document.querySelectorAll<HTMLButtonElement>('[data-thrust]').forEach(b=>{b.onclick=()=>thrust(b.dataset.thrust as 'forward'|'back'|'left'|'right')});
reset();toast('Engines off — horizon dive initiated');requestAnimationFrame(frame);
