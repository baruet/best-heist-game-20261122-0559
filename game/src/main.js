// The Gilded Hour — the game itself.
// One job: own the state machine (title → planning → play → caught/win),
// step the simulation, and hand each frame to render.js.
// Shot mode (?shot=cover|planning|alarm|getaway) draws one frozen state
// and never starts the loop, so screenshots are deterministic.
import {
  CANVAS_W, CANVAS_H, FIELD_W, FIELD_H, FIELD_Y,
  THIEF_SPEED, THIEF_RADIUS, ALARM_MAX,
  ALERT_ALARM_RATE, CAMERA_ALARM_RATE, ALARM_DECAY,
  ROUTE_BONUS_LOOT, TOOL_START,
} from './config.js';
import { ROOMS } from './levels.js';
import { makeGuard, updateGuard, lureGuards } from './guards.js';
import { makeCamera, updateCamera } from './cameras.js';
import { makeLoot, tryPickup } from './loot.js';
import { makeTools, dropSmoke, throwNoise, updateTools, buyTool } from './tools.js';
import { makeInput, attachInput, moveVector } from './input.js';
import {
  ensureAudio, toggleMute, playPickup, playThrow, playSmoke, playSpotted,
  playCaught, playWin, playClick, startAlarmLoop, stopAlarmLoop,
} from './audio.js';
import {
  drawGame, drawTitle, drawPlanning, drawCaught, drawWin, planningLayout,
} from './render.js';
import { buildShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = makeInput();
attachInput(input, canvas);

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');

// ---------------------------------------------------------------- state
function solidsOf(room) {
  return [...room.walls, ...room.cover];
}

function startRoom(roomIndex, routeIndex, carry) {
  const room = ROOMS[roomIndex];
  const route = room.routes[routeIndex];
  const guards = room.guards
    .slice(0, Math.max(1, room.guards.length + route.guards))
    .map((d) => makeGuard(d, route.speedMul));
  const cameras = room.cameras.map((d) => makeCamera(d));
  if (route.cameras > 0) {
    cameras.push(makeCamera({ x: 760, y: 8, baseAngle: Math.PI / 2, sweep: 0.7, speed: 0.6 }));
  }
  const loot = room.loot.map((d) => makeLoot(d));
  if (route.bonusLoot) {
    loot.push(makeLoot({ ...ROUTE_BONUS_LOOT, kind: 'gem', value: 400, label: 'Bonus Stash' }));
  }
  const tools = makeTools(carry.tools);
  const s = {
    phase: 'planning',
    roomIndex,
    room,
    route,
    thief: { x: route.start.x, y: route.start.y, facing: 0, hidden: false },
    guards,
    cameras,
    loot,
    tools,
    coins: carry.coins,
    alarm: route.alarmStart,
    lootValue: 0,
    elapsed: 0,
    score: carry.score,
    totalLoot: carry.totalLoot,
    banner: null,
    bannerLeft: 0,
    planning: { selected: routeIndex },
    caughtReason: null,
    t: 0,
    spotted: false,
    roomStart: null, // snapshot taken when the heist begins
  };
  return s;
}

let state = startRoom(0, 0, {
  tools: { smoke: TOOL_START.smoke, noise: TOOL_START.noise },
  coins: 150,
  score: { loot: 0, timeBonus: 0, stealthBonus: 0, toolBonus: 0, time: 0, alarm: 0, total: 0 },
  totalLoot: 0,
});
state.phase = 'title'; // startRoom builds a planning state; the game opens on the title

function snapshotRoomStart() {
  state.roomStart = {
    tools: { smoke: state.tools.smoke, noise: state.tools.noise },
    coins: state.coins,
    alarm: state.alarm,
  };
}

function retryRoom() {
  const carry = {
    tools: state.roomStart.tools,
    coins: state.roomStart.coins,
    score: state.score,
    totalLoot: state.totalLoot,
  };
  state = startRoom(state.roomIndex, state.planning.selected, carry);
  beginHeist();
}

function beginHeist() {
  snapshotRoomStart();
  state.phase = 'play';
  state.banner = null;
  playClick();
}

function finishRoom() {
  const room = state.room;
  const timeBonus = Math.max(0, Math.round((room.timeBonus - state.elapsed) * 2));
  const stealthBonus = Math.round((100 - state.alarm) * 2);
  state.score.loot += state.lootValue;
  state.score.timeBonus += timeBonus;
  state.score.stealthBonus += stealthBonus;
  state.score.time += state.elapsed;
  state.totalLoot += state.lootValue;
  state.coins += Math.floor(state.lootValue / 5);
  stopAlarmLoop();
  if (state.roomIndex >= ROOMS.length - 1) {
    state.score.toolBonus = (state.tools.smoke + state.tools.noise) * 25;
    state.score.alarm = state.alarm;
    state.score.total = state.score.loot + state.score.timeBonus + state.score.stealthBonus + state.score.toolBonus;
    state.phase = 'win';
    playWin();
    return;
  }
  const carry = {
    tools: { smoke: state.tools.smoke, noise: state.tools.noise },
    coins: state.coins,
    score: state.score,
    totalLoot: state.totalLoot,
  };
  state = startRoom(state.roomIndex + 1, 0, carry);
  state.banner = { text: `Room cleared! +$${state.score.loot} stolen so far`, color: '#22c55e' };
  state.bannerLeft = 3;
}

function getCaught(reason) {
  state.phase = 'caught';
  state.caughtReason = reason;
  stopAlarmLoop();
  playCaught();
}

// ------------------------------------------------------------- movement
function collideCircle(x, y, r, solids) {
  for (const s of solids) {
    const cx = Math.max(s.x, Math.min(x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(y, s.y + s.h));
    const dx = x - cx;
    const dy = y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r) {
      const d = Math.sqrt(d2) || 0.001;
      const push = r - d;
      x += (dx / d) * push;
      y += (dy / d) * push;
    }
  }
  x = Math.max(r, Math.min(FIELD_W - r, x));
  y = Math.max(r, Math.min(FIELD_H - r, y));
  return { x, y };
}

function moveThief(dt) {
  const v = moveVector(input);
  if (v.x !== 0 || v.y !== 0) {
    state.thief.facing = Math.atan2(v.y, v.x);
  }
  const solids = solidsOf(state.room);
  let nx = state.thief.x + v.x * THIEF_SPEED * dt;
  let ny = state.thief.y + v.y * THIEF_SPEED * dt;
  // Axis-separated so Wren slides along walls instead of sticking.
  const afterX = collideCircle(nx, state.thief.y, THIEF_RADIUS, solids);
  const afterY = collideCircle(afterX.x, ny, THIEF_RADIUS, solids);
  state.thief.x = afterY.x;
  state.thief.y = afterY.y;
  // Smoke hides the thief from every eye.
  state.thief.hidden = state.tools.smokes.some(
    (s) => Math.hypot(state.thief.x - s.x, state.thief.y - s.y) <= s.radius,
  );
}

// --------------------------------------------------------------- update
function update(dt) {
  if (state.phase !== 'play') return;
  state.t += dt;
  state.elapsed += dt;
  if (state.bannerLeft > 0) {
    state.bannerLeft -= dt;
    if (state.bannerLeft <= 0) state.banner = null;
  }

  moveThief(dt);
  updateTools(state.tools, dt);

  // Smoke (Q) at Wren's feet; click throws a noise maker at the cursor.
  if (input.smokePressed) {
    input.smokePressed = false;
    if (dropSmoke(state.tools, state.thief.x, state.thief.y)) {
      playSmoke();
      state.banner = { text: 'Smoke! The cones cannot see through it', color: '#e5e7eb' };
      state.bannerLeft = 2;
    }
  }
  if (input.click) {
    const c = input.click;
    input.click = null;
    if (c.y >= FIELD_Y && throwNoise(state.tools, c.x, c.y - FIELD_Y)) {
      playThrow();
      lureGuards(state.guards, c.x, c.y - FIELD_Y);
    }
  }

  // Guards and cameras.
  const solids = solidsOf(state.room);
  let seenByGuard = false;
  let seenByCamera = false;
  for (const g of state.guards) {
    if (updateGuard(g, dt, state.thief, solids, state.tools.smokes)) seenByGuard = true;
  }
  for (const cam of state.cameras) {
    if (updateCamera(cam, state.t, state.thief, solids, state.tools.smokes)) seenByCamera = true;
  }

  // Fair catch: suspicion fills first, the alarm climbs only while a guard
  // is fully alert or a camera watches. The player always gets a warning.
  const anyAlert = state.guards.some((g) => g.state === 'alert');
  if (seenByGuard || seenByCamera) {
    state.alarm += ((seenByGuard ? ALERT_ALARM_RATE : 0) + (seenByCamera ? CAMERA_ALARM_RATE : 0)) * dt;
    state.alarm = Math.min(ALARM_MAX, state.alarm);
    if (!state.spotted) {
      state.spotted = true;
      playSpotted();
      state.banner = { text: 'SPOTTED! Break line of sight!', color: '#ef4444' };
      state.bannerLeft = 2.5;
      startAlarmLoop();
    }
  } else {
    state.alarm = Math.max(0, state.alarm - ALARM_DECAY * dt);
    if (state.alarm < 20) {
      state.spotted = false;
      stopAlarmLoop();
    }
  }

  // A guard who reaches Wren while alert ends the room.
  for (const g of state.guards) {
    if (g.state === 'alert' && Math.hypot(g.x - state.thief.x, g.y - state.thief.y) < 22) {
      getCaught('A guard grabbed Wren in the open. Plan a quieter route.');
      return;
    }
  }
  if (state.alarm >= ALARM_MAX) {
    getCaught('The alarm hit 100%. The gallery locks down and Wren is caught.');
    return;
  }

  // Loot.
  const gained = tryPickup(state.loot, state.thief.x, state.thief.y);
  if (gained > 0) {
    state.lootValue += gained;
    playPickup();
    if (state.lootValue >= state.room.requiredLoot && !state.banner) {
      state.banner = { text: 'GETAWAY! Reach the green exit!', color: '#22c55e' };
      state.bannerLeft = 3;
    }
  }

  // Exit.
  const e = state.room.exit;
  if (
    state.lootValue >= state.room.requiredLoot &&
    state.thief.x > e.x && state.thief.x < e.x + e.w &&
    state.thief.y > e.y && state.thief.y < e.y + e.h
  ) {
    finishRoom();
  }
}

// ---------------------------------------------------------------- input
function pointIn(box, x, y) {
  return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
}

function handleKey(code) {
  ensureAudio();
  if (code === 'KeyM') {
    toggleMute();
    return;
  }
  if (state.phase === 'title') {
    if (code === 'Enter' || code === 'Space') state.phase = 'planning';
    return;
  }
  if (state.phase === 'planning') {
    if (code === 'Digit1') state.planning.selected = 0;
    if (code === 'Digit2') state.planning.selected = 1;
    if (code === 'Digit3') state.planning.selected = 2;
    if (code === 'KeyS') {
      const r = buyTool(state.tools, 'smoke', state.coins);
      if (r.ok) { state.coins = r.coins; playClick(); }
    }
    if (code === 'KeyN') {
      const r = buyTool(state.tools, 'noise', state.coins);
      if (r.ok) { state.coins = r.coins; playClick(); }
    }
    if (code === 'Enter') {
      // Rebuild the room with the chosen route, carrying the bought tools.
      const carry = {
        tools: { smoke: state.tools.smoke, noise: state.tools.noise },
        coins: state.coins,
        score: state.score,
        totalLoot: state.totalLoot,
      };
      state = startRoom(state.roomIndex, state.planning.selected, carry);
      beginHeist();
    }
    return;
  }
  if (state.phase === 'play') {
    if (code === 'KeyP') {
      state.phase = 'paused';
      stopAlarmLoop();
    }
    return;
  }
  if (state.phase === 'paused') {
    if (code === 'KeyP') state.phase = 'play';
    return;
  }
  if (state.phase === 'caught') {
    if (code === 'KeyR') retryRoom();
    return;
  }
  if (state.phase === 'win') {
    if (code === 'Enter') {
      state = startRoom(0, 0, {
        tools: { smoke: TOOL_START.smoke, noise: TOOL_START.noise },
        coins: 150,
        score: { loot: 0, timeBonus: 0, stealthBonus: 0, toolBonus: 0, time: 0, alarm: 0, total: 0 },
        totalLoot: 0,
      });
    }
  }
}

canvas.addEventListener('mousedown', () => {
  ensureAudio();
  if (state.phase === 'title') {
    state.phase = 'planning';
    return;
  }
  if (state.phase === 'planning') {
    const L = planningLayout();
    const m = input.mouse;
    L.routes.forEach((box, i) => {
      if (pointIn(box, m.x, m.y)) {
        state.planning.selected = i;
        playClick();
      }
    });
    if (pointIn(L.smokeBuy, m.x, m.y)) {
      const r = buyTool(state.tools, 'smoke', state.coins);
      if (r.ok) { state.coins = r.coins; playClick(); }
    }
    if (pointIn(L.noiseBuy, m.x, m.y)) {
      const r = buyTool(state.tools, 'noise', state.coins);
      if (r.ok) { state.coins = r.coins; playClick(); }
    }
    if (pointIn(L.start, m.x, m.y)) {
      const carry = {
        tools: { smoke: state.tools.smoke, noise: state.tools.noise },
        coins: state.coins,
        score: state.score,
        totalLoot: state.totalLoot,
      };
      state = startRoom(state.roomIndex, state.planning.selected, carry);
      beginHeist();
    }
  }
});

// ------------------------------------------------------------------ loop
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (input.key) {
    const code = input.key;
    input.key = null;
    handleKey(code);
  }
  // update() advances t while playing; advance it here for the other phases
  // so title and planning screens still animate.
  if (state.phase !== 'play') state.t += dt;
  update(dt);
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  if (state.phase === 'title') drawTitle(ctx, state.t);
  else if (state.phase === 'planning') { drawGame(ctx, state, state.t); drawPlanning(ctx, state, state.t); }
  else if (state.phase === 'caught') { drawGame(ctx, state, state.t); drawCaught(ctx, state); }
  else if (state.phase === 'win') { drawGame(ctx, state, state.t); drawWin(ctx, state); }
  else drawGame(ctx, state, state.t);
  requestAnimationFrame(frame);
}

if (shotName) {
  // One frozen frame, no loop: the screenshot is fully deterministic.
  const shot = buildShot(shotName);
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawGame(ctx, shot, shot.t);
  if (shot.phase === 'planning') drawPlanning(ctx, shot, shot.t);
} else {
  requestAnimationFrame(frame);
}
