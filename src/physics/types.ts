export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];
export type Mat4 = [Vec4, Vec4, Vec4, Vec4];

export const add3 = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const scale3 = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot3 = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const norm3 = (a: Vec3): number => Math.sqrt(dot3(a, a));
export const normalize3 = (a: Vec3): Vec3 => {
  const n = norm3(a);
  if (!(n > 0)) throw new Error('Cannot normalize zero vector');
  return scale3(a, 1 / n);
};
