import { raise } from '../physics/metric';
import type { WorldlineState } from '../physics/integrator';
import type { Vec3 } from '../physics/types';

export type CameraMode='first'|'follow'|'orbit'|'inspection';
export type EntityKind='probe'|'astronaut';
type Projected={x:number;y:number;scale:number;visible:boolean};

const add=(a:Vec3,b:Vec3):Vec3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a:Vec3,b:Vec3):Vec3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const mul=(a:Vec3,s:number):Vec3=>[a[0]*s,a[1]*s,a[2]*s];
const dot=(a:Vec3,b:Vec3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a:Vec3,b:Vec3):Vec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=(a:Vec3,fallback:Vec3=[1,0,0]):Vec3=>{const n=Math.hypot(...a);return n>1e-9?mul(a,1/n):fallback};

export interface InspectionState{
  worldline:WorldlineState;
  trail:Vec3[];
  entity:EntityKind;
  mode:Exclude<CameraMode,'first'>;
  orbitYaw:number;
  orbitPitch:number;
  followDistance:number;
  attitude:number;
  overlays:boolean;
}

export class InspectionRenderer{
  private ctx:CanvasRenderingContext2D;
  private stars:{x:number;y:number;r:number;a:number;c:string}[]=[];
  private smoothCamera:Vec3|null=null;
  constructor(private canvas:HTMLCanvasElement){
    this.ctx=canvas.getContext('2d',{alpha:false})!;
    let seed=0x51a7c0de;
    const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
    for(let i=0;i<900;i++)this.stars.push({x:random(),y:random(),r:.25+random()*1.15,a:.25+random()*.7,c:random()>.82?'#b9d8ff':random()<.16?'#ffd5ac':'#eef6ff'});
  }
  render(s:InspectionState){
    const dpr=Math.min(devicePixelRatio,2),w=Math.max(2,Math.floor(this.canvas.clientWidth*dpr)),h=Math.max(2,Math.floor(this.canvas.clientHeight*dpr));
    if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h}
    const ctx=this.ctx;ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#01050a';ctx.fillRect(0,0,w,h);
    for(const star of this.stars){ctx.globalAlpha=star.a;ctx.fillStyle=star.c;ctx.fillRect(star.x*w,star.y*h,star.r*dpr,star.r*dpr)}ctx.globalAlpha=1;
    const u=raise(s.worldline.x,s.worldline.p),velocity=unit([u[1],u[2],u[3]],[-1,0,0]),upSeed:Vec3=Math.abs(velocity[2])>.92?[0,1,0]:[0,0,1];
    const follow=s.mode==='follow';
    const desired:Vec3=follow?add(add(s.worldline.x,mul(velocity,-s.followDistance)),mul(upSeed,s.followDistance*.22)):
      s.mode==='orbit'?add(s.worldline.x,[s.followDistance*Math.cos(s.orbitPitch)*Math.cos(s.orbitYaw),s.followDistance*Math.cos(s.orbitPitch)*Math.sin(s.orbitYaw),s.followDistance*Math.sin(s.orbitPitch)]):
      [0,-Math.max(18,Math.hypot(...s.worldline.x)*1.15),Math.max(10,Math.hypot(...s.worldline.x)*.42)];
    this.smoothCamera=this.smoothCamera?add(mul(this.smoothCamera,.88),mul(desired,.12)):desired;
    const camera=this.smoothCamera;
    const target=s.worldline.x,forward=unit(sub(target,camera)),right=unit(cross(forward,upSeed),[1,0,0]),up=unit(cross(right,forward),[0,0,1]);
    const focal=Math.min(w,h)*.82;
    const project=(point:Vec3):Projected=>{const rel=sub(point,camera),z=dot(rel,forward);return{x:w/2+dot(rel,right)*focal/Math.max(z,.01),y:h/2-dot(rel,up)*focal/Math.max(z,.01),scale:focal/Math.max(z,.01),visible:z>.05}};
    const drawOrbit=(radius:number,color:string,label:string,dash:number[])=>{ctx.beginPath();let begun=false;for(let i=0;i<=128;i++){const a=i/128*Math.PI*2,p=project([Math.cos(a)*radius,Math.sin(a)*radius,0]);if(!p.visible)continue;if(!begun){ctx.moveTo(p.x,p.y);begun=true}else ctx.lineTo(p.x,p.y)}ctx.setLineDash(dash.map(v=>v*dpr));ctx.strokeStyle=color;ctx.lineWidth=1*dpr;ctx.stroke();ctx.setLineDash([]);const tag=project([radius,0,0]);if(tag.visible){ctx.fillStyle=color;ctx.font=`${10*dpr}px ui-monospace`;ctx.fillText(label,tag.x+6*dpr,tag.y)}};
    if(s.overlays){drawOrbit(6,'rgba(139,229,240,.28)','ISCO · 6M',[5,6]);drawOrbit(3,'rgba(255,199,118,.35)','PHOTON SPHERE · 3M',[3,5])}
    const hole=project([0,0,0]);if(hole.visible){const radius=Math.max(2,2*hole.scale),gradient=ctx.createRadialGradient(hole.x,hole.y,radius*.6,hole.x,hole.y,radius*1.45);gradient.addColorStop(0,'#000');gradient.addColorStop(.68,'#000');gradient.addColorStop(.74,'rgba(255,171,83,.72)');gradient.addColorStop(.79,'rgba(113,193,255,.2)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(hole.x,hole.y,radius*1.45,0,Math.PI*2);ctx.fill();if(s.overlays){ctx.strokeStyle='rgba(255,118,82,.65)';ctx.setLineDash([4*dpr,5*dpr]);ctx.beginPath();ctx.arc(hole.x,hole.y,radius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([])}}
    if(s.trail.length>1){ctx.beginPath();let started=false;for(const point of s.trail){const p=project(point);if(!p.visible)continue;if(!started){ctx.moveTo(p.x,p.y);started=true}else ctx.lineTo(p.x,p.y)}ctx.strokeStyle='rgba(139,229,240,.46)';ctx.lineWidth=1.5*dpr;ctx.stroke()}
    const entity=project(target);if(entity.visible)this.drawEntity(entity.x,entity.y,Math.max(14,Math.min(44,entity.scale*.7)),s.entity,s.attitude,dpr);
    ctx.fillStyle='rgba(139,229,240,.72)';ctx.font=`${10*dpr}px ui-monospace`;ctx.fillText(`ACTUAL WORLDLINE · r=${Math.hypot(...s.worldline.x).toFixed(2)}M`,18*dpr,h-20*dpr);
  }
  private drawEntity(x:number,y:number,size:number,kind:EntityKind,attitude:number,dpr:number){const c=this.ctx;c.save();c.translate(x,y);c.rotate(attitude);c.lineWidth=1.2*dpr;if(kind==='probe'){c.fillStyle='#8899a2';c.strokeStyle='#d9f4f7';c.fillRect(-size*.3,-size*.22,size*.6,size*.44);c.strokeRect(-size*.3,-size*.22,size*.6,size*.44);c.fillStyle='#315b72';c.fillRect(-size*1.05,-size*.16,size*.68,size*.32);c.fillRect(size*.37,-size*.16,size*.68,size*.32);c.strokeStyle='#bdeaf0';c.beginPath();c.arc(0,-size*.28,size*.3,Math.PI,0);c.stroke();c.beginPath();c.moveTo(0,-size*.28);c.lineTo(0,-size*.7);c.stroke();c.fillStyle='#ffbd6f';c.beginPath();c.moveTo(-size*.18,size*.24);c.lineTo(0,size*.62);c.lineTo(size*.18,size*.24);c.fill()}else{c.strokeStyle='#e7eef1';c.fillStyle='#bbc8cd';c.beginPath();c.arc(0,-size*.48,size*.22,0,Math.PI*2);c.fill();c.stroke();c.fillRect(-size*.2,-size*.25,size*.4,size*.62);c.strokeRect(-size*.2,-size*.25,size*.4,size*.62);c.lineWidth=size*.12;c.beginPath();c.moveTo(-size*.18,-size*.08);c.lineTo(-size*.5,size*.18);c.moveTo(size*.18,-size*.08);c.lineTo(size*.5,size*.18);c.moveTo(-size*.1,size*.35);c.lineTo(-size*.25,size*.72);c.moveTo(size*.1,size*.35);c.lineTo(size*.25,size*.72);c.stroke();c.fillStyle='#14232b';c.beginPath();c.arc(0,-size*.5,size*.15,0,Math.PI*2);c.fill()}c.restore()}
}
