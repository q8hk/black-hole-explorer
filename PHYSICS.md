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
| Thin disk | First equatorial ray intersection in `3.15M < r < 9M` | Kerr–Schild ray path | Illustrative emissive surface only; no plasma dynamics or radiative transfer | Visual regression/manual inspection |

The renderer traces a ray for every rendered pixel. The dark capture region is the set of backward rays that do not reach the celestial sphere within physical/numerical termination rules; it is not a drawn sphere.

## Timelike trajectory presets

Preset velocities are physical three-velocities measured by the local static orthonormal observer at the initial event. With radial and transverse components `(vᵣ,vₜ)`, the initial four-velocity is `u=γ(e₀+vᵣeᵣ+vₜeₜ)`, where `γ=1/sqrt(1-vᵣ²-vₜ²)`. It is lowered with the Kerr–Schild metric to initialize canonical momentum. No later point is scripted.

| Preset | Initial `(r/M, vᵣ/c, vₜ/c)` | E | L/M | Expected outcome |
|---|---:|---:|---:|---|
| Approach | `(14, -0.240, 0.160)` | 0.966917 | 2.339434 | Capture after a visibly off-axis approach |
| Radial plunge | `(8, -0.120, 0)` | 0.872329 | 0 | Horizon crossing |
| Flyby | `(40, -0.340, 0.280)` | 1.085661 | 12.475286 | Deflection and escape |
| Orbital encounter | `(12, -0.080, 0.380)` | 0.990614 | 4.948344 | Close angular-momentum-supported encounter |
| Circular orbit | `(10, 0, 0.353553)` | 0.956183 | 3.779645 | Stable circular geodesic |
| ISCO | `(6, 0, 0.500)` | 0.942809 | 3.464102 | Marginally stable circular geodesic |
| Near-critical plunge | `(20, -0.250, 0.205)` | 1.002523 | 4.332685 | Near the capture/escape separatrix |

Here `E=-p_t` and `L=xp_y-yp_x` are conserved specific quantities. Automated tests verify timelike normalization, subluminal local speed, analytic circular/ISCO constants, conservation, horizon crossing, and flyby escape/deflection.

## Camera architecture

The first-person renderer launches each ray as `k=u+nⁱeᵢ` in the physical observer tetrad and integrates it backward. The follow, orbit, and scientific inspection modes do not launch physical camera rays. They project the already-computed worldline into a Euclidean explanatory view, and therefore cannot change the trajectory, conserved quantities, horizon crossing, or proper time. Entity attitude is likewise visual state: stabilized or gently rotating, independent from four-momentum.

The inspection rings at `2M`, `3M`, and `6M` identify the horizon, photon sphere, and Schwarzschild ISCO. They are reference overlays, not material structures.

## Units

Internal calculations use `G=c=M=1`. One length unit is `GM/c²`; one time unit is `GM/c³`. The horizon radius is `2M`, the photon sphere is `3M`, and the Schwarzschild ISCO is `6M`.

## Error policy

The CPU exposes `|H+1/2|` for the observer. GPU debug key `G` cycles physical image, step count, and null-Hamiltonian drift. Rays that exhaust the selected step budget use a dim provisional sky sample rather than being silently classified as horizon capture; the debug views expose where that occurs.
