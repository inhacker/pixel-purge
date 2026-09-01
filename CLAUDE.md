# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Pixel Purge — a 2D top-down pixel-art arcade shooter that runs entirely in
the browser. The whole game is one self-contained file, `index.html`: no
build step, no package manager, no external assets or dependencies. All
sprites are pixel-map string arrays baked to canvases at runtime; audio is
procedural WebAudio.

## Running it

- Open `index.html` directly in a browser (works from `file://`), or serve
  it locally: `python3 -m http.server 8000` then visit `localhost:8000`.
- There is no build, lint, or package-manager step — editing `index.html`
  and reloading the browser is the entire dev loop.
- Self-tests: append `?test` to the URL (e.g. `index.html?test`) to run a
  handful of `console.assert` checks on the math/collision helpers and
  confirm sprites baked correctly. Check the browser console for output.
- There is no headless test runner in the repo. To verify changes without a
  browser, extract the `<script>` body and run it under Node with the
  `document`/`window`/canvas globals stubbed (a `CanvasRenderingContext2D`
  proxy of no-ops is enough), then drive `update()`/`render()` directly —
  this is how prior changes here were regression-tested end-to-end (menu →
  3 levels → boss → win, and the game-over path) before opening a browser.

## Architecture

Everything lives inside the single `<script>` block in `index.html`, laid
out top-to-bottom as it executes/depends:

1. **CONFIG** — `cfg` (player speed/HP/fire rate/bullet stats), `ENEMY`
   (per-type stats: grunt/runner/shooter/boss), `LEVELS` (array of 3 level
   configs: enemy count, allowed types, spawn interval, `boss: true` on the
   last). These three objects are the tuning knobs — balance changes go
   here, not scattered through the update logic.
2. **Math/util helpers** — `clamp`, `dist2`, `angleTo`, `circleHit`, etc.
   Shared by movement, AI steering, and collision; reuse these rather than
   re-deriving vector math inline.
3. **Sprite baker** (`bakeSprite`, `whiten`, `DEFS`, `SPR`) — a sprite is a
   `{palette, frames}` object where each frame is an array of equal-ish
   strings (one char = one pixel; `.`/space = transparent). `bakeSprite`
   rasterizes every frame once to an offscreen `<canvas>` at build time;
   `whiten` derives a white-silhouette version of each frame for the
   hit-flash effect. `SPR[name].frames` / `SPR[name].white` are what
   rendering code actually draws — new characters/animations are added by
   extending `DEFS`, not by drawing shapes ad hoc in the render functions.
4. **Audio** (`tone`, `sfx`) — a single generic oscillator/gain helper
   (`tone`) that every named effect in `sfx` calls with different
   frequency/duration/waveform. Add new sounds by composing `tone()` calls,
   not by writing new WebAudio boilerplate.
5. **Input** — a `keys` Set (arrow keys + WASD aliased via `KEYMAP`), a
   `mouse` object updated in canvas coordinates (accounts for CSS scaling),
   and an `advancePressed` edge-trigger flag used by every non-gameplay
   screen (menu/level-clear/game-over/win) to mean "click or Enter".
6. **Entities & state machine** — `player` is a single object; `enemies`,
   `bullets`, `particles`, `pickups` are flat arrays of plain objects with
   circle colliders (`x, y, r`). `state` is one of the `STATE` enum values
   (`MENU, PLAYING, LEVEL_CLEAR, GAME_OVER, WIN, PAUSED`); `update()` and
   `render()` both switch on `state` and only run gameplay logic in
   `PLAYING`. Enemy type-specific behavior (movement, firing) is dispatched
   by `e.type` inside the main enemy loop in `updatePlaying`, with
   `updateShooter`/`updateBoss` split out since they're stateful (phases,
   fire cooldowns) rather than pure steer-toward-player.
7. **Spawn director / level flow** — `spawnedCount`/`spawnTimer` track
   progress through the current `LEVELS[currentLevel]` config; a level ends
   when its quota is spawned and `enemies` is empty, except the boss level,
   which spawns the boss only after the normal quota clears and ends when
   the boss dies. `initLevel()` / `completeLevel()` / `startGame()` are the
   only places that mutate `currentLevel`/`state` for progression — route
   new transitions through them rather than setting `state` directly.
8. **Main loop** — `requestAnimationFrame` driving a fixed-timestep
   accumulator (`STEP = 1/60`), decoupled from display refresh rate and
   clamped against spiral-of-death after tab refocus. Gameplay logic must
   stay inside `update(dt)`; `render()` is expected to be a pure function of
   current state (no mutation) since it can run more or fewer times than
   `update`.

## Working conventions for this repo

- Git/GitHub is the save/versioning mechanism for this project: commit
  changes with clean, descriptive messages and push to `origin/main`
  (remote already configured, `gh` authenticated) after meaningful changes,
  without waiting to be asked each time.
