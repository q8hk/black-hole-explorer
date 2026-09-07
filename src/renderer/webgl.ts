import { fragmentShader, vertexShader } from './shader';
import type { Vec3, Vec4 } from '../physics/types';

export interface RenderState { camera: Vec3; tetrad: [Vec4,Vec4,Vec4,Vec4]; yaw: number; pitch: number; quality: Quality; debug: number; starDensity:number; exposure:number; }
export type Quality = 'low'|'medium'|'high'|'scientific';
const qualityMap: Record<Quality,{scale:number;steps:number}> = { low:{scale:.5,steps:104}, medium:{scale:.67,steps:160}, high:{scale:.82,steps:240}, scientific:{scale:1,steps:320} };

export class RelativisticRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private locations: Record<string,WebGLUniformLocation>;
  constructor(private canvas: HTMLCanvasElement){
    const gl=canvas.getContext('webgl2',{antialias:false,alpha:false,powerPreference:'high-performance'});
    if(!gl) throw new Error('WebGL2 unavailable'); this.gl=gl;
    const compile=(type:number,source:string)=>{const s=gl.createShader(type)!;gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)??'Shader compile failed');return s};
    const program=gl.createProgram()!;gl.attachShader(program,compile(gl.VERTEX_SHADER,vertexShader));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragmentShader));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)??'Shader link failed');this.program=program;
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);gl.useProgram(program);const a=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
    this.locations={}; for(const name of ['u_resolution','u_camera','u_tetrad[0]','u_look','u_maxSteps','u_cutoff','u_debug','u_starDensity','u_exposure']){const loc=gl.getUniformLocation(program,name);if(loc)this.locations[name]=loc;}
  }
  render(s:RenderState){
    const gl=this.gl,q=qualityMap[s.quality],dpr=Math.min(devicePixelRatio,2),w=Math.max(2,Math.floor(this.canvas.clientWidth*dpr*q.scale)),h=Math.max(2,Math.floor(this.canvas.clientHeight*dpr*q.scale));if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
    gl.viewport(0,0,w,h);gl.useProgram(this.program);gl.uniform2f(this.locations.u_resolution!,w,h);gl.uniform3fv(this.locations.u_camera!,s.camera);gl.uniform4fv(this.locations['u_tetrad[0]']!,new Float32Array(s.tetrad.flat()));gl.uniform2f(this.locations.u_look!,s.yaw,s.pitch);gl.uniform1i(this.locations.u_maxSteps!,q.steps);gl.uniform1f(this.locations.u_cutoff!,.12);gl.uniform1i(this.locations.u_debug!,s.debug);gl.uniform1f(this.locations.u_starDensity!,s.starDensity);gl.uniform1f(this.locations.u_exposure!,s.exposure);gl.drawArrays(gl.TRIANGLES,0,3);
  }
}
