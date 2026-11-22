# The Gilded Hour — a midnight heist at the Velmora Gallery of Hours

[![make.fun](https://make.fun/badge/bounty/best-heist-game-20261122-0559)](https://make.fun/best-heist-game-20261122-0559)
[![status](https://make.fun/badge/status/verified-final)](https://make.fun/best-heist-game-20261122-0559)
[![game](https://make.fun/badge/game/top-down-stealth)](https://make.fun/best-heist-game-20261122-0559)

You are **Wren**, gentleman thief. One night, three rooms, one target: the
**Hourglass of Velmora**. Plan your way in, slip past the patrols and the
cameras, lift the loot, and get out before the alarm hits 100%.

## Play

Open `game/index.html` in a desktop browser — no build step, no network, no
server needed (or serve it with `node serve.ts`).

- **WASD / arrows** — move
- **Q** — smoke bomb (hides you from every cone)
- **Click** — throw a noise maker (pulls guards toward the sound)
- **P** — pause · **M** — mute

## How a heist works

1. **Planning** — before each room, pick one of three routes (each changes
   guards, cameras, speed and the alarm) and buy tools with the coins your
   earlier loot earned.
2. **The job** — guards patrol with vision cones and a suspicion meter;
   cameras sweep and raise the alarm faster. Being seen fills the alarm —
   but you always get a warning first: suspicion fills, the guard
   investigates, and only a fully alert guard (or a camera) climbs the
   alarm. Break line of sight and it falls again.
3. **The getaway** — fill the room's loot target, reach the green exit, and
   the loot becomes coins for the next room's plan. Clear all three rooms
   and the Hourglass is yours.

## Rooms

| Room | Guards | Cameras | Loot target |
| --- | --- | --- | --- |
| 1 — The Marble Foyer | 2 | 1 | $700 |
| 2 — The Clockwork Gallery | 3 | 2 | $1,400 |
| 3 — The Vault of Hours | 4 | 3 | $2,600 |

Score: loot stolen + time bonus + stealth bonus + tools left over.

## Structure

```
game/
  index.html          page shell
  styles.css          page shell styles
  src/
    config.js         every shared number and colour
    levels.js         the three rooms, their routes and loot
    cones.js          vision cones and line-of-sight
    guards.js         patrols, suspicion, alert, investigate
    cameras.js        sweeping wall cameras
    loot.js           the things Wren steals
    tools.js          smoke bombs and noise makers
    input.js          keyboard and mouse
    audio.js          WebAudio synth — no audio files
    render.js         everything the player sees
    shots.js          frozen states for the screenshots
    main.js           state machine and game loop
screenshots/          4 staged renders from the game's own code
main.ts               hand-in program (Node 22, stdlib only)
```

Screenshots are deterministic: `?shot=cover|planning|alarm|getaway` renders one
frozen state from the game's own render code, no animation time, no randomness.

## License

MIT — see [LICENSE](LICENSE).
