export const vertexShader = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main(){ v_uv=a_position*.5+.5; gl_Position=vec4(a_position,0.,1.); }`;

export const fragmentShader = `#version 300 es
precision highp float;
precision highp int;
in vec2 v_uv;
out vec4 outColor;
uniform vec2 u_resolution;
uniform vec3 u_camera;
uniform vec4 u_tetrad[4];
uniform vec2 u_look;
uniform int u_maxSteps;
uniform float u_cutoff;
uniform int u_debug;
uniform float u_starDensity;
uniform float u_exposure;

float hash21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
vec3 sky(vec3 d){
  d=normalize(d); float lon=atan(d.z,d.x)/6.2831853+.5; float lat=asin(clamp(d.y,-1.,1.))/3.1415926+.5;
  vec2 cell=floor(vec2(lon*900.,lat*450.)); vec2 f=fract(vec2(lon*900.,lat*450.)); float h=hash21(cell);
  vec2 q=vec2(hash21(cell+1.7),hash21(cell+8.3)); float dist=length(f-q);
  float threshold=mix(.986,.94,u_starDensity); float star=smoothstep(.045,.0,dist)*step(threshold,h)*pow((h-threshold)/(1.-threshold),1.8)*5.;
  float temp=hash21(cell+21.); vec3 tint=mix(vec3(.55,.72,1.),vec3(1.,.72,.42),temp);
  float band=exp(-pow(abs(dot(d,normalize(vec3(.13,.91,.38))))/.12,1.35))*(.018+.035*hash21(cell*.17));
  float nebula=pow(max(0.,1.-abs(dot(d,normalize(vec3(-.62,.18,.76))))),7.)*(.025+.045*hash21(cell*.09));
  vec3 base=vec3(.001,.0025,.006)+band*vec3(.25,.42,.62)+nebula*vec3(.35,.08,.42);
  return base+star*tint;
}

void deriv(vec3 x, vec4 p, out vec3 dx, out vec3 dp){
  float r=length(x); vec3 n=x/r; float f=2./r; float np=dot(n,p.yzw); float q=-p.x+np;
  dx=p.yzw-f*n*q;
  vec3 df=-f*n/r; vec3 dq=(p.yzw-np*n)/r;
  dp=.5*df*q*q+f*q*dq;
}
void rk4(inout vec3 x,inout vec4 p,float h){
  vec3 x1,p1,x2,p2,x3,p3,x4,p4;
  deriv(x,p,x1,p1);
  deriv(x+.5*h*x1,vec4(p.x,p.yzw+.5*h*p1),x2,p2);
  deriv(x+.5*h*x2,vec4(p.x,p.yzw+.5*h*p2),x3,p3);
  deriv(x+h*x3,vec4(p.x,p.yzw+h*p3),x4,p4);
  x+=h*(x1+2.*x2+2.*x3+x4)/6.;
  p.yzw+=h*(p1+2.*p2+2.*p3+p4)/6.;
}
mat4 gcov(vec3 x){
  float r=length(x); vec3 n=x/r; float f=2./r; vec4 l=vec4(1.,n); mat4 g=mat4(-1.,0.,0.,0.,0.,1.,0.,0.,0.,0.,1.,0.,0.,0.,0.,1.);
  for(int i=0;i<4;i++) for(int j=0;j<4;j++) g[i][j]+=f*l[i]*l[j]; return g;
}
float H(vec3 x,vec4 p){ float r=length(x); vec3 n=x/r; float q=-p.x+dot(n,p.yzw); return .5*(-p.x*p.x+dot(p.yzw,p.yzw)-2./r*q*q); }
void main(){
  vec2 ndc=(gl_FragCoord.xy-.5*u_resolution)/u_resolution.y; vec3 d=normalize(vec3(ndc*1.55,-1.));
  float cy=cos(u_look.x),sy=sin(u_look.x),cp=cos(u_look.y),sp=sin(u_look.y);
  d=vec3(cy*d.x-sy*d.z,d.y,sy*d.x+cy*d.z); d=vec3(d.x,cp*d.y-sp*d.z,sp*d.y+cp*d.z);
  vec4 k=u_tetrad[0]+d.z*u_tetrad[1]+d.x*u_tetrad[2]+d.y*u_tetrad[3];
  vec4 p=gcov(u_camera)*k; vec3 x=u_camera; float maxDrift=0.; float steps=0.; bool captured=false; bool escaped=false; bool diskHit=false; vec3 diskColor=vec3(0.);
  for(int i=0;i<320;i++){
    if(i>=u_maxSteps) break; float r=length(x); if(r<u_cutoff){captured=true;break;} if(r>80.){escaped=true;break;}
    vec3 dx,dp; deriv(x,p,dx,dp); float h=-min(.8,max(.006,.11*max(r-1.75,.08)/max(length(dx),.2)));
    rk4(x,p,h); float diskR=length(x.xy); float diskThickness=.008+.001*diskR;
    if(!diskHit&&diskR>3.15&&diskR<9.0&&abs(x.z)<diskThickness){float heat=pow(3.15/diskR,.72);float grain=.82+.18*hash21(floor(x.xy*22.));diskColor=mix(vec3(1.8,.22,.025),vec3(1.4,1.05,.58),heat)*(.45+2.1*heat)*grain;diskHit=true;}
    maxDrift=max(maxDrift,abs(H(x,p))); steps+=1.; if(any(isnan(x))||any(isinf(x))){captured=true;break;}
  }
  if(u_debug==1){ outColor=vec4(vec3(steps/float(u_maxSteps)),1.); return; }
  if(u_debug==2){ float e=clamp((log(maxDrift+1e-9)/log(10.)+9.)/6.,0.,1.); outColor=vec4(e,1.-e,.1,1.); return; }
  vec3 col=escaped?sky(normalize(x)):vec3(.00015,.0003,.00045);
  if(diskHit) col=diskColor;
  if(!escaped&&!captured&&!diskHit) col=sky(normalize(x))*.42;
  float vignette=1.-.28*dot(ndc,ndc); col*=vignette;
  col*=u_exposure; col=col/(col+vec3(1.)); col=pow(col,vec3(1./2.2)); outColor=vec4(col,1.);
}`;
