// The Gilded Hour — the three rooms of the Velmora Gallery of Hours.
// One job: pure data. Every room lists its walls, cover, guards, cameras,
// loot, exit and the three planning routes the player picks before the run.
import { FIELD_W, FIELD_H } from './config.js';

// A wall or a piece of cover is { x, y, w, h } in field coordinates
// (0..FIELD_W, 0..FIELD_H). Guards patrol their waypoints in order and
// wait `wait` seconds at each one. Cameras sweep around baseAngle.
export const ROOMS = [
  {
    id: 1,
    name: 'Room 1 — The Marble Foyer',
    intro: 'Two guards, one camera. Learn their rhythm, lift $700, slip out the east door.',
    requiredLoot: 700,
    timeBonus: 120,
    thiefStart: { x: 60, y: FIELD_H - 60 },
    exit: { x: FIELD_W - 74, y: 26, w: 48, h: 64, label: 'EAST DOOR' },
    walls: [
      { x: 300, y: 0, w: 18, h: 220 },
      { x: 300, y: 340, w: 18, h: FIELD_H - 340 },
      { x: 620, y: 120, w: 18, h: 260 },
    ],
    cover: [
      { x: 150, y: 120, w: 44, h: 44, kind: 'pedestal' },
      { x: 420, y: 90, w: 52, h: 36, kind: 'crate' },
      { x: 470, y: 430, w: 44, h: 44, kind: 'pedestal' },
      { x: 760, y: 300, w: 52, h: 36, kind: 'crate' },
      { x: 180, y: 420, w: 44, h: 44, kind: 'pedestal' },
    ],
    guards: [
      { waypoints: [{ x: 380, y: 130 }, { x: 380, y: 470 }, { x: 560, y: 500 }, { x: 560, y: 130 }], speed: 62, wait: 1.0 },
      { waypoints: [{ x: 700, y: 480 }, { x: 880, y: 480 }, { x: 880, y: 120 }], speed: 58, wait: 1.4 },
    ],
    cameras: [
      { x: 480, y: 8, baseAngle: Math.PI / 2, sweep: 0.7, speed: 0.55 },
    ],
    loot: [
      { x: 172, y: 200, kind: 'vase', value: 300, label: 'Gilded Vase' },
      { x: 492, y: 500, kind: 'gem', value: 250, label: 'Garnet' },
      { x: 786, y: 380, kind: 'painting', value: 450, label: 'Portrait of Hours' },
    ],
    routes: [
      { id: 'A', name: 'Service Corridor', desc: 'One guard stays in the back hall. +1 camera watches the foyer.', guards: -1, cameras: 0, lootBonus: 0, speedMul: 1.0, start: { x: 60, y: FIELD_H - 60 }, alarmStart: 0 },
      { id: 'B', name: 'Grand Hall', desc: 'Straight through the middle. An extra $400 canvas, but patrols move 15% faster.', guards: 0, cameras: 0, lootBonus: 400, speedMul: 1.15, start: { x: 60, y: 60 }, alarmStart: 0 },
      { id: 'C', name: 'Rooftop Vent', desc: 'Drop in beside the loot. Patrols move 25% faster and the alarm starts at 10.', guards: 0, cameras: 0, lootBonus: 0, speedMul: 1.25, start: { x: 700, y: 90 }, alarmStart: 10 },
    ],
  },
  {
    id: 2,
    name: 'Room 2 — The Clockwork Gallery',
    intro: 'Three guards, two cameras, tighter cover. Lift $1,400 before the clock strikes.',
    requiredLoot: 1400,
    timeBonus: 150,
    thiefStart: { x: 60, y: FIELD_H - 60 },
    exit: { x: FIELD_W - 74, y: FIELD_H - 96, w: 48, h: 64, label: 'WEST WING' },
    walls: [
      { x: 240, y: 0, w: 18, h: 180 },
      { x: 240, y: 300, w: 18, h: FIELD_H - 300 },
      { x: 520, y: 150, w: 18, h: 280 },
      { x: 760, y: 0, w: 18, h: 200 },
    ],
    cover: [
      { x: 120, y: 100, w: 44, h: 44, kind: 'pedestal' },
      { x: 330, y: 90, w: 52, h: 36, kind: 'crate' },
      { x: 400, y: 520, w: 44, h: 44, kind: 'pedestal' },
      { x: 600, y: 90, w: 44, h: 44, kind: 'pedestal' },
      { x: 660, y: 500, w: 52, h: 36, kind: 'crate' },
      { x: 840, y: 300, w: 44, h: 44, kind: 'pedestal' },
    ],
    guards: [
      { waypoints: [{ x: 300, y: 120 }, { x: 300, y: 470 }, { x: 480, y: 470 }, { x: 480, y: 120 }], speed: 72, wait: 0.8 },
      { waypoints: [{ x: 620, y: 480 }, { x: 880, y: 480 }, { x: 900, y: 260 }, { x: 700, y: 260 }], speed: 68, wait: 1.0 },
      { waypoints: [{ x: 820, y: 60 }, { x: 820, y: 240 }, { x: 580, y: 240 }], speed: 66, wait: 1.2 },
    ],
    cameras: [
      { x: 400, y: 8, baseAngle: Math.PI / 2, sweep: 0.8, speed: 0.7 },
      { x: FIELD_W - 8, y: 300, baseAngle: Math.PI, sweep: 0.7, speed: 0.6 },
    ],
    loot: [
      { x: 142, y: 180, kind: 'vase', value: 350, label: 'Clockwork Vase' },
      { x: 356, y: 160, kind: 'gem', value: 300, label: 'Sapphire' },
      { x: 622, y: 170, kind: 'painting', value: 500, label: 'The Long Minute' },
      { x: 862, y: 380, kind: 'gem', value: 350, label: 'Topaz' },
    ],
    routes: [
      { id: 'A', name: 'Service Corridor', desc: 'One guard stays in the back hall. +1 camera watches the gallery.', guards: -1, cameras: 0, lootBonus: 0, speedMul: 1.0, start: { x: 60, y: FIELD_H - 60 }, alarmStart: 0 },
      { id: 'B', name: 'Grand Hall', desc: 'Straight through the middle. An extra $400 canvas, but patrols move 15% faster.', guards: 0, cameras: 0, lootBonus: 400, speedMul: 1.15, start: { x: 60, y: 60 }, alarmStart: 0 },
      { id: 'C', name: 'Rooftop Vent', desc: 'Drop in beside the loot. Patrols move 25% faster and the alarm starts at 10.', guards: 0, cameras: 0, lootBonus: 0, speedMul: 1.25, start: { x: 700, y: 90 }, alarmStart: 10 },
    ],
  },
  {
    id: 3,
    name: 'Room 3 — The Vault of Hours',
    intro: 'Four guards, three cameras, and the Hourglass of Velmora. Lift $2,600, then run for the vault door.',
    requiredLoot: 2600,
    timeBonus: 180,
    thiefStart: { x: 60, y: 60 },
    exit: { x: FIELD_W - 74, y: FIELD_H - 96, w: 48, h: 64, label: 'VAULT DOOR' },
    walls: [
      { x: 220, y: 0, w: 18, h: 200 },
      { x: 220, y: 320, w: 18, h: FIELD_H - 320 },
      { x: 480, y: 100, w: 18, h: 240 },
      { x: 700, y: 260, w: 18, h: FIELD_H - 260 },
      { x: 480, y: 460, w: 220, h: 18 },
    ],
    cover: [
      { x: 110, y: 130, w: 44, h: 44, kind: 'pedestal' },
      { x: 300, y: 90, w: 52, h: 36, kind: 'crate' },
      { x: 560, y: 90, w: 44, h: 44, kind: 'pedestal' },
      { x: 560, y: 380, w: 52, h: 36, kind: 'crate' },
      { x: 780, y: 130, w: 44, h: 44, kind: 'pedestal' },
      { x: 330, y: 520, w: 44, h: 44, kind: 'pedestal' },
      { x: 840, y: 430, w: 52, h: 36, kind: 'crate' },
    ],
    guards: [
      { waypoints: [{ x: 280, y: 120 }, { x: 280, y: 480 }, { x: 430, y: 480 }, { x: 430, y: 120 }], speed: 80, wait: 0.7 },
      { waypoints: [{ x: 540, y: 510 }, { x: 660, y: 510 }, { x: 660, y: 60 }, { x: 540, y: 60 }], speed: 78, wait: 0.8 },
      { waypoints: [{ x: 760, y: 480 }, { x: 900, y: 480 }, { x: 900, y: 200 }, { x: 820, y: 200 }], speed: 74, wait: 1.0 },
      { waypoints: [{ x: 120, y: 300 }, { x: 200, y: 300 }, { x: 200, y: 500 }, { x: 120, y: 500 }], speed: 70, wait: 1.0 },
    ],
    cameras: [
      { x: 360, y: 8, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.8 },
      { x: FIELD_W - 8, y: 200, baseAngle: Math.PI, sweep: 0.8, speed: 0.7 },
      { x: 620, y: FIELD_H - 8, baseAngle: -Math.PI / 2, sweep: 0.8, speed: 0.65 },
    ],
    loot: [
      { x: 132, y: 200, kind: 'vase', value: 400, label: 'Midnight Vase' },
      { x: 340, y: 150, kind: 'gem', value: 350, label: 'Emerald' },
      { x: 582, y: 170, kind: 'painting', value: 550, label: 'The Stolen Hour' },
      { x: 802, y: 210, kind: 'gem', value: 400, label: 'Ruby' },
      { x: 582, y: 440, kind: 'hourglass', value: 1500, label: 'Hourglass of Velmora' },
    ],
    routes: [
      { id: 'A', name: 'Service Corridor', desc: 'One guard stays in the back hall. +1 camera watches the vault.', guards: -1, cameras: 0, lootBonus: 0, speedMul: 1.0, start: { x: 60, y: 60 }, alarmStart: 0 },
      { id: 'B', name: 'Grand Hall', desc: 'Straight through the middle. An extra $400 canvas, but patrols move 15% faster.', guards: 0, cameras: 0, lootBonus: 400, speedMul: 1.15, start: { x: 60, y: FIELD_H - 60 }, alarmStart: 0 },
      { id: 'C', name: 'Rooftop Vent', desc: 'Drop in beside the loot. Patrols move 25% faster and the alarm starts at 10.', guards: 0, cameras: 0, lootBonus: 0, speedMul: 1.25, start: { x: 700, y: 90 }, alarmStart: 10 },
    ],
  },
];

// The extra canvas route B adds, placed in open floor of every room.
export const ROUTE_BONUS_LOOT = { x: 440, y: 300, kind: 'painting', value: 400, label: 'Bonus Canvas' };
