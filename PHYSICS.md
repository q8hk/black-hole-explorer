# Physics model

| Phenomenon | Model / equation | Coordinates | Approximation and expected error | Validation |
|---|---|---|---|---|
| Spacetime | Schwarzschild as `g=eta+(2M/r) l⊗l` | Ingoing Cartesian Kerr–Schild | Exact classical vacuum solution; floating-point evaluation | Metric inverse test |
| Photon paths | Hamilton equations, `H=½ g^μν p_μ p_ν=0` | Kerr–Schild | WebGL2 float32 RK4; truncation grows for near-critical rays | Analytic shadow angle and critical impact parameter |
| Probe free fall | Timelike Hamilton equations, `H=-½` | Kerr–Schild | CPU float64 RK4; adaptive substeps | Constraint drift; radial analytic solution |
| Camera | `k=u+n^i e_i`; metric Gram–Schmidt tetrad | Local orthonormal frame | Instantaneously exact; arbitrary-axis transport is continuity-stabilized, not full Fermi–Walker | Orthonormality test |
| Horizon | `r=2M` causal boundary | Horizon-regular Kerr–Schild | No coordinate termination at horizon | Finite proper-time crossing test |
| Station keeping | `a=GM/[r² sqrt(1-2M/r)]` | Static Schwarzschild observer | Exact outside horizon; undefined at/inside | Divergence check |
| Tides | Electric Riemann eigenvalues `(+2,-1,-1)GM/r³` | Freely falling orthonormal frame | Point-separation/geodesic-deviation limit across 1.8 m | `M^-2` horizon scaling test |
| Pulse receiver | Outgoing radial null rays via tortoise coordinate `r*=r+2M ln(r/2M-1)` | Exterior Schwarzschild chart | Exact for radial signals in vacuum; receiver fixed at 80M | Causal horizon cutoff and interval ratio |
| Star field | Deterministic procedural celestial sphere | Source sphere at 80M | Star positions/brightness are visualization data, not a catalog; surface-brightness filtering is approximate | Determinism test planned |

The renderer traces a ray for every rendered pixel. The dark capture region is the set of backward rays that do not reach the celestial sphere within physical/numerical termination rules; it is not a drawn sphere.

## Units

Internal calculations use `G=c=M=1`. One length unit is `GM/c²`; one time unit is `GM/c³`. The horizon radius is `2M`, the photon sphere is `3M`, and the Schwarzschild ISCO is `6M`.

## Error policy

The CPU exposes `|H+1/2|` for the observer. GPU debug key `G` cycles physical image, step count, and null-Hamiltonian drift. Step-budget exhaustion is rendered with a brown diagnostic tint rather than silently classified as horizon capture.
