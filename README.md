# Relativistic Black Hole Explorer

A client-side Schwarzschild simulator built around the metric, observer, and geodesics. It is a general-relativity explorer with game-like controls, not a conventional 3D scene with a distortion effect.

## Current validated scope

- Schwarzschild spacetime in horizon-regular ingoing Cartesian Kerr–Schild coordinates
- Per-pixel backward null-geodesic integration in WebGL2
- Deterministic procedural celestial sphere
- First-person physical observer view plus clearly labeled follow, orbit, and scientific inspection cameras
- Procedural probe and astronaut representations, trajectory trail, and horizon/photon-sphere/ISCO overlays
- Optional illustrative thin-disk emission, star-density and exposure controls, and live FPS/quality readout
- Metric-orthonormal instantaneous observer tetrad
- Explicit station keeping with required proper acceleration
- Engine-off timelike free fall across the event horizon
- Normalized approach, plunge, flyby, orbital, circular, ISCO, and near-critical trajectory presets
- Local rapidity-impulse probe/astronaut thrusters
- Separate observer proper time and coordinate chart
- Causal once-per-second radial pulse experiment to a distant receiver
- Tidal acceleration across a 1.8 m body
- Desktop and touch controls, adaptive render quality, debug views

Kerr and accretion-disk milestones are intentionally gated and not represented as complete. Read [RESEARCH_AND_DESIGN.md](docs/RESEARCH_AND_DESIGN.md), [PHYSICS.md](PHYSICS.md), and [LIMITATIONS.md](LIMITATIONS.md) before extending them.

## Controls

- Drag / touch the first-person view: look around the local observer frame
- Drag an external view: orbit the inspection camera; mouse wheel changes its distance
- Camera menu: switch views without changing the physical worldline
- `W/S`: inward/outward local rapidity impulse
- `A/D`: lateral local rapidity impulse
- `F`: engine cutoff / free fall
- `H`: station keep (outside the horizon only)
- `Space`: pause
- `G`: physical image → integration steps → null-Hamiltonian drift

The controls apply small local impulses, then return the object to geodesic motion. “Station keep” is an accelerated worldline and displays the required proper acceleration.

The default mission begins at `r=14M` with an inward local velocity and modest transverse component, looking toward the lens at a playable `10×` time rate. Its path is not animated or scripted: the subsequent approach and horizon crossing are produced by the same timelike Hamiltonian integrator used by every preset.

The first-person camera constructs photons in the observer's local orthonormal tetrad and is the physical view. Follow, orbit, and scientific inspection cameras are Euclidean presentation views of the same computed position; the on-screen label makes that distinction explicit.

## Development

```bash
npm ci
npm test
npm run build
npm run dev
```

The built site is in `dist/` and has no runtime external-service dependency.

## Raspberry Pi deployment

On a Raspberry Pi with Docker and the Compose plugin:

```bash
sudo install -m 0755 deploy/black-hole-explorer-mdns /usr/local/bin/
sudo install -m 0644 deploy/black-hole-explorer-mdns.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now black-hole-explorer-mdns.service
docker compose up -d
```

Open `http://black-hole-explorer.local`. The included systemd service advertises this site-specific mDNS alias without changing the Pi's primary hostname, and the container serves the site on the default HTTP port. The Pi only serves static assets; WebGL2 geodesic integration runs on the visiting device's GPU.

After pulling source changes, rebuild the immutable static image:

```bash
docker compose up -d --build
```

The Compose service uses a read-only filesystem, drops privilege escalation, restarts after reboot, and exposes only port 80.

## Scientific versioning

Do not describe an unfinished milestone as implemented. A new physical phenomenon requires: its model and coordinates in `PHYSICS.md`, assumptions in `LIMITATIONS.md`, a cited source in `REFERENCES.md`, analytic/numerical validation, and a stable milestone commit.
