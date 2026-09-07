# Research and physics design gate

Status: accepted for Milestones 2–7 (Schwarzschild). Kerr remains gated until the Schwarzschild validation suite and renderer diagnostics pass.

## 1. Findings

### BlackHoleCam WebGR

WebGR is an outreach-oriented, real-time Schwarzschild vacuum renderer. It maps camera directions to a distant celestial sphere using general-relativistic ray tracing, and uses a Gaia-derived all-sky background. Its public explanation correctly separates the event-horizon shadow from a material surface and demonstrates the photon sphere and the shrinking escape cone near the horizon. Its freely flying camera is explicitly unaffected by gravity, so it is a viewing tool rather than a worldline simulator. We adopt the backward-ray/celestial-sphere methodology, not code or assets.

### kyleyhw/black_hole

The referenced implementation uses Cartesian Kerr–Schild coordinates, a Hamiltonian null-geodesic formulation, per-pixel WebGL2 RK4 integration, a metric-orthonormal camera tetrad, and a float64 CPU/Python mirror for validation. This is an excellent architectural reference: Kerr–Schild coordinates are horizon-penetrating and avoid polar-axis and Boyer–Lindquist horizon singularities. The repository currently shows no license file or license declaration on its GitHub page. Therefore no source, shader, textures, or data are copied. We independently implement the Schwarzschild member of the Kerr–Schild family from the published metric and equations.

### NASA plunge visualization

NASA Goddard's 2024 visualization models a non-rotating 4.3-million-solar-mass black hole, follows both fly-by and horizon-crossing cameras, and qualitatively exposes aberration, multiple disk images, photon rings, local versus Schwarzschild coordinate time, and tidal destruction. It required offline supercomputer rendering, so it is a qualitative validation target, not a real-time performance baseline. Its reported horizon radius (~12.5 million km) agrees with `2GM/c²` at the stated mass to rounding.

### GR literature

Riazuelo (2015) provides the closest scientific target: arbitrary-velocity observers, inside-horizon viewing, aberration, Doppler shift, amplification, and correct star rendering in Schwarzschild spacetime. GYOTO establishes backward integration of null geodesics and independent validation against analytic cases. Bacchini et al. show why invariant/Hamiltonian drift must be monitored and why explicit RK methods require careful step control near strong-field critical trajectories. Bardeen, Press & Teukolsky provide the Kerr horizon/orbit quantities reserved for Milestone 8.

## 2. Proposed physical model

The first validated release is the Schwarzschild vacuum exterior and interior, represented in ingoing Cartesian Kerr–Schild coordinates with signature `(-,+,+,+)` and geometrized units `G=c=M=1` internally. The metric is

`g_mu_nu = eta_mu_nu + (2M/r) l_mu l_nu`,

where `l_mu = (1, x/r, y/r, z/r)`. Its inverse is `g^mu_nu = eta^mu_nu - (2M/r) l^mu l^nu`. These coordinates are regular at `r=2M`; the curvature singularity remains at `r=0`.

Massive probes are test particles: their mass and thrust do not alter spacetime. Engine-off motion follows the timelike Hamiltonian with `H=-1/2`. Thruster commands are finite rapidity impulses in the observer's local orthonormal frame; this is an explicitly labeled impulse approximation to finite-duration proper acceleration.

## 3. Coordinates

- Simulation and ray tracing: ingoing Cartesian Kerr–Schild. Horizon regular, nonsingular on an axis, GPU-friendly.
- Educational readout outside the horizon: areal radius `r` and optional Schwarzschild time. The latter is marked coordinate-dependent and becomes unsuitable at the horizon.
- Signal experiment: outgoing radial null geodesics evaluated through the Schwarzschild retarded-time relation outside `r=2M`. This is exact for radial light in Schwarzschild vacuum.
- No Kruskal second exterior or white-hole region is shown. The interpretation is a one-sided astrophysical black hole formed by collapse.

## 4. Photon algorithm

For each pixel, construct an arriving future-directed null vector `k = u + n^i e_i` from the observer four-velocity and spatial tetrad. Lower it with the local metric to obtain canonical momentum, then integrate Hamilton's equations backward in affine parameter. A ray terminates on horizon/past singularity capture, escape to the procedural celestial sphere, numerical failure, or the configured step budget. `H` drift is available as a debug output.

The production WebGL2 shader uses RK4-quality integration where budget allows, displacement-bounded adaptive steps, and reduced render resolution before reduced physical step accuracy. The CPU mirror uses float64. WebGL2 normally uses float32, so near-critical photon-ring substructure is resolution- and precision-limited and must not be presented as research-grade radiative transfer.

## 5. Massive-particle worldlines

Canonical state is `(x^i, p_i, p_t, t_KS, tau)`. In a stationary metric `p_t` is conserved during free fall. Hamilton's equations are integrated in proper time with adaptive RK4. A local tetrad is rebuilt from the normalized four-velocity and continuity-preserving spatial seeds. Thrust applies a local Lorentz boost (rapidity increment), after which the covariant momentum is recomputed. The code checks `g(u,u)=-1`.

## 6. Observer and tetrad

`e_0=u`. Spatial basis vectors are metric Gram–Schmidt orthonormalized and then rotated by player yaw/pitch. This guarantees a physically valid instantaneous local frame. In the first release, arbitrary accelerated-camera axes are continuity-stabilized rather than fully Fermi–Walker transported; that is a documented visualization approximation. Radial free-fall and stationary frames use symmetry-aligned exact tetrads.

## 7. Integration strategy

- CPU worldlines: adaptive RK4 with step rejection using one full step versus two half steps; normalization and Hamiltonian constraints tracked.
- GPU rays: fixed maximum loop for WebGL2 portability, local adaptive affine step based on radius and coordinate displacement, explicit capture/escape/error termination.
- Scientific mode: highest step count and render scale; it remains an interactive educational calculation, not a substitute for double-precision offline GRRT.
- Singular endpoint: stop at a configurable curvature cutoff above `r=0` and enter `UNKNOWN / CLASSICAL MODEL ENDS`.

## 8. GPU strategy

One fullscreen WebGL2 fragment pass independently integrates each ray. The celestial sphere is deterministic and procedural so the LAN deployment has no runtime dependencies. Quality levels primarily vary resolution and temporal update cadence. Step-count reductions are separately disclosed in the UI. WebGPU is deferred until WebGL2 parity and validation exist.

## 9. Validation plan

Automated float64 tests cover `r_s=2M`, stationary time dilation/redshift, `r_ph=3M`, `r_ISCO=6M`, critical impact parameter `3 sqrt(3) M`, weak-field bending `4M/b`, radial infall proper time, finite horizon crossing, metric inverse, tetrad orthonormality, and Hamiltonian drift. Renderer acceptance compares the apparent shadow angle for a static observer against `sin(alpha)=3 sqrt(3) M sqrt(1-2M/r_obs)/r_obs`. Kerr work will add analytic `r_+`, ergosurface, ISCO, photon orbits, and `E,L_z,Q` drift tests before it is exposed as validated.

## 10. Expected performance

At 60 fps, mobile/older integrated GPUs should use 0.45–0.65 render scale and 64–96 steps; desktop GPUs should sustain 0.75–1.0 scale and 128–256 steps depending on photon-ring occupancy. Scientific mode may be sub-real-time. The Raspberry Pi only serves static files; no simulation runs server-side.

## 11. License assessment

- `kyleyhw/black_hole`: no visible license; all-rights-reserved default applies. Methodology study only, zero code/assets reused.
- WebGR: no implementation license established during review. Methodology study only. Its Gaia map is identified as CC BY-SA 3.0 IGO, but is not bundled here.
- NASA SVS: used as a cited qualitative reference; no media is bundled.
- This project is original implementation. A project license must be selected by the owner before third-party redistribution.

## 12. Roadmap and gates

1. Research/design and scope corrections.
2. Schwarzschild metric, units, observables, tetrads, timelike/null integrators, tests.
3. WebGL2 null-geodesic renderer and procedural sky.
4. Local-frame observer, look controls, probe/astronaut impulses.
5. Engine-off free fall and horizon crossing to classical cutoff.
6. Causal radial pulse experiment and dual-observer panel.
7. Tidal tensor readout, explanations, presets, mobile controls.
8. Kerr only after independent analytic validation.
9. Disk only after redshift transfer and intersection tests.
10. optimization and Raspberry Pi packaging.

## Specification corrections

- Vacuum black-hole images are scale-free at fixed `r/M`; mass changes apparent size only if an absolute observer distance is held fixed.
- “Distant stationary observer” must be a specified finite-radius static observer or the asymptotic limit, and cannot exist at or inside the horizon.
- There is no unique absolute speed “relative to the black hole”; the UI must name the measuring tetrad.
- The photon sphere (`r=3M` in Schwarzschild) is a spacetime orbit set; observed photon rings are image features and are not identical to it.
- `|a*|<=1` is the mathematical Kerr bound. `0.998` is a commonly used thin-disk spin-up limit, not a fundamental censorship bound.
- An eternal Schwarzschild solution contains extra regions not expected for a collapse-formed astrophysical hole. The UI adopts a one-sided collapse interpretation and does not visualize a white hole.
- Exact continuum physics is not attainable numerically. “Exact GR” means the exact metric/geodesic equations with measured discretization error, never zero numerical error.
