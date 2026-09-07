# Relativistic Black Hole Explorer

A client-side Schwarzschild simulator built around the metric, observer, and geodesics. It is a general-relativity explorer with game-like controls, not a conventional 3D scene with a distortion effect.

## Current validated scope

- Schwarzschild spacetime in horizon-regular ingoing Cartesian Kerr–Schild coordinates
- Per-pixel backward null-geodesic integration in WebGL2
- Deterministic procedural celestial sphere
- Metric-orthonormal instantaneous observer tetrad
- Explicit station keeping with required proper acceleration
- Engine-off timelike free fall across the event horizon
- Local rapidity-impulse probe/astronaut thrusters
- Separate observer proper time and coordinate chart
- Causal once-per-second radial pulse experiment to a distant receiver
- Tidal acceleration across a 1.8 m body
- Desktop and touch controls, adaptive render quality, debug views

Kerr and accretion-disk milestones are intentionally gated and not represented as complete. Read [RESEARCH_AND_DESIGN.md](docs/RESEARCH_AND_DESIGN.md), [PHYSICS.md](PHYSICS.md), and [LIMITATIONS.md](LIMITATIONS.md) before extending them.

## Controls

- Drag / touch the view: look around the local observer frame
- `W/S`: inward/outward local rapidity impulse
- `A/D`: lateral local rapidity impulse
- `F`: engine cutoff / free fall
- `H`: station keep (outside the horizon only)
- `Space`: pause
- `G`: physical image → integration steps → null-Hamiltonian drift

The controls apply small local impulses, then return the object to geodesic motion. “Station keep” is an accelerated worldline and displays the required proper acceleration.

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
sudo hostnamectl set-hostname black-hole-explorer
docker compose up -d
sudo reboot
```

Open `http://black-hole-explorer.local`. Raspberry Pi OS advertises the hostname on the local network with mDNS, and the container serves the site on the default HTTP port. The Pi only serves static assets; WebGL2 geodesic integration runs on the visiting device's GPU.

After pulling source changes, rebuild the immutable static image:

```bash
docker compose up -d --build
```

The Compose service uses a read-only filesystem, drops privilege escalation, restarts after reboot, and exposes only port 80.

## Scientific versioning

Do not describe an unfinished milestone as implemented. A new physical phenomenon requires: its model and coordinates in `PHYSICS.md`, assumptions in `LIMITATIONS.md`, a cited source in `REFERENCES.md`, analytic/numerical validation, and a stable milestone commit.
