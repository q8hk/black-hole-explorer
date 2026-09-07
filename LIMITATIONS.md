# Limitations

- Version 0.1 is Schwarzschild only. Kerr spin, frame dragging, ergosphere, Carter constant, and spin-dependent ISCO are deliberately not simulated yet.
- The optional thin disk is an illustrative emissive surface sampled where traced rays first meet the equatorial plane. It is not a GRMHD disk: there is no absorption, scattering, spectral transfer, self-shadowing, magnetic field, or plasma evolution.
- WebGL2 fragment arithmetic is generally 32-bit floating point. Very high-order photon rings and near-critical trajectories exceed the reliable precision/step budget.
- The procedural stars are invented and their filtered surface brightness is not photometrically exact. Their paths are still integrated through the metric.
- The arbitrary moving observer has an instantaneous orthonormal tetrad, but its displayed axes are not yet fully Fermi–Walker transported.
- Follow, orbit, and scientific inspection cameras use Euclidean projection and a stylized scale. They are deliberately labeled nonphysical and must not be used to infer apparent angular size, redshift, or lensing.
- Probe and astronaut graphics are original procedural vector drawings, not externally sourced models. Their size, illumination, attitude, and exhaust are illustrative and do not feed back into the integrator.
- Thruster controls are local finite rapidity impulses, not a resolved rocket-engine burn or propellant model.
- Trajectory preset labels describe numerically validated qualitative outcomes, not closed-form mission designs. The near-critical result is sensitive to floating-point precision and small changes in initial conditions by definition.
- The dual-observer experiment traces radial outgoing pulses to a static receiver at 80M. It does not yet ray trace an image of an extended probe.
- A collapse-formed, one-sided black hole is intended. The white-hole region and second asymptotic exterior of maximally extended eternal Schwarzschild spacetime are not visualized.
- Hawking radiation, backreaction, quantum gravity, self-force, charge, plasma, magnetic fields, radiation transfer, and gravitational waves are outside the model.
- The simulation stops above `r=0`. Classical GR predicts a singular boundary but does not establish the physics at the singularity.
- “Scientific” quality increases resolution and integration steps; it does not turn the browser into a double-precision research GRRT code.
- The ray-traced disk can show sampling bands and flicker at low quality because it uses a single finite-step plane-intersection test. Raising quality reduces but does not eliminate this artifact.
