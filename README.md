# Pixel Purge

A simple 2D top-down arcade shooter that runs entirely in the browser — one
self-contained `index.html`, no build step, no dependencies. All sprites are
retro pixel art generated in code (no image assets).

## Play

Open `index.html` directly in a browser, or serve it locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Controls

| Input | Action |
|---|---|
| Arrow keys / WASD | Move |
| Mouse | Aim |
| Left click (hold) | Shoot |
| `P` | Pause |
| `M` | Mute |
| `` ` `` | Debug overlay (FPS, hitboxes, entity counts) |

## The game

Menu → 3 levels of rising difficulty (more enemies, new types) → a boss
fight on level 3 → win screen. Health, score, and level-clear/game-over
screens throughout. Add `?test` to the URL to run the in-console self-tests.

## Project structure

Everything lives in `index.html`: a sprite baker that turns pixel-map string
arrays into offscreen canvases, entity/AI logic, a fixed-timestep game loop,
and procedural WebAudio sound effects. Tunable constants (`cfg`, `ENEMY`,
`LEVELS`) sit near the top of the `<script>` block.
