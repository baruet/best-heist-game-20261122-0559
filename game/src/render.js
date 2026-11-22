// The Gilded Hour — everything the player sees.
// One job: draw the field, the people, the cones, the HUD and every screen.
// Nothing here changes game state; main.js owns the state, this only paints it.
import {
  CANVAS_W, CANVAS_H, HUD_H, FIELD_W, FIELD_H, FIELD_Y,
  CONE_HALF_ANGLE, CONE_RANGE, CAM_CONE_HALF_ANGLE, CAM_CONE_RANGE,
  ALARM_MAX, COLORS, GAME_NAME, GALLERY_NAME, THIEF_NAME, TOOL_PRICES,
} from './config.js';
import { conePolygon } from './cones.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function drawFloor(ctx, t) {
  ctx.fillStyle = COLORS.floorA;
  ctx.fillRect(0, FIELD_Y, FIELD_W, FIELD_H);
  const tile = 48;
  ctx.fillStyle = COLORS.floorB;
  for (let y = 0; y < FIELD_H / tile; y++) {
    for (let x = 0; x < FIELD_W / tile; x++) {
      if ((x + y) % 2 === 0) ctx.fillRect(x * tile, FIELD_Y + y * tile, tile, tile);
    }
  }
  // Gold medallions set into the marble.
  ctx.strokeStyle = COLORS.wallTrim;
  ctx.lineWidth = 2;
  for (const [mx, my] of [[150, 90], [810, 490], [480, 500]]) {
    ctx.beginPath();
    ctx.arc(mx, FIELD_Y + my, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(mx, FIELD_Y + my, 14, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Border trim.
  ctx.strokeStyle = COLORS.wallTrim;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, FIELD_Y + 2, FIELD_W - 4, FIELD_H - 4);
}

function drawWallsAndCover(ctx, room) {
  for (const w of room.walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, FIELD_Y + w.y, w.w, w.h);
    ctx.strokeStyle = COLORS.wallTrim;
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x, FIELD_Y + w.y, w.w, w.h);
  }
  for (const c of room.cover) {
    ctx.fillStyle = c.kind === 'pedestal' ? COLORS.pedestal : COLORS.cover;
    ctx.fillRect(c.x, FIELD_Y + c.y, c.w, c.h);
    ctx.fillStyle = COLORS.coverTop;
    ctx.fillRect(c.x + 4, FIELD_Y + c.y + 4, c.w - 8, 8);
    ctx.strokeStyle = COLORS.wallTrim;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(c.x, FIELD_Y + c.y, c.w, c.h);
  }
}

function drawExit(ctx, room, unlocked, t) {
  const e = room.exit;
  const pulse = unlocked ? 0.55 + 0.25 * Math.sin(t * 4) : 0.25;
  ctx.fillStyle = `rgba(34, 197, 94, ${pulse})`;
  ctx.fillRect(e.x - 6, FIELD_Y + e.y - 6, e.w + 12, e.h + 12);
  ctx.fillStyle = unlocked ? COLORS.exit : '#14532d';
  ctx.fillRect(e.x, FIELD_Y + e.y, e.w, e.h);
  ctx.strokeStyle = COLORS.hudGold;
  ctx.lineWidth = 2;
  ctx.strokeRect(e.x, FIELD_Y + e.y, e.w, e.h);
  ctx.fillStyle = '#052e16';
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', e.x + e.w / 2, FIELD_Y + e.y + e.h / 2 + 4);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '10px Georgia, serif';
  ctx.fillText(e.label, e.x + e.w / 2, FIELD_Y + e.y + e.h + 14);
}

function drawLoot(ctx, lootList, t) {
  for (const item of lootList) {
    if (item.taken) continue;
    const x = item.x;
    const y = FIELD_Y + item.y;
    const tw = 0.6 + 0.4 * Math.sin(t * 3 + item.sparkle);
    ctx.fillStyle = COLORS.lootGlow;
    ctx.beginPath();
    ctx.arc(x, y, 20 + 6 * tw, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.loot;
    if (item.kind === 'gem' || item.kind === 'hourglass') {
      ctx.beginPath();
      ctx.moveTo(x, y - 10);
      ctx.lineTo(x + 8, y);
      ctx.lineTo(x, y + 10);
      ctx.lineTo(x - 8, y);
      ctx.closePath();
      ctx.fill();
    } else if (item.kind === 'painting') {
      ctx.fillRect(x - 10, y - 7, 20, 14);
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 10, y - 7, 20, 14);
    } else {
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 4, y - 13, 8, 5);
    }
    // Sparkle star.
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + 0.5 * tw})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 12);
    ctx.lineTo(x - 6, y - 6);
    ctx.moveTo(x + 12, y - 12);
    ctx.lineTo(x + 6, y - 6);
    ctx.stroke();
    ctx.fillStyle = COLORS.hudText;
    ctx.font = '10px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(`$${item.value}`, x, y + 24);
  }
}

function drawCone(ctx, x, y, facing, halfAngle, range, alert) {
  const pts = conePolygon(x, y, facing, halfAngle, range);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fillStyle = alert ? COLORS.coneAlert : COLORS.coneCalm;
  ctx.fill();
  ctx.strokeStyle = alert ? COLORS.coneAlertEdge : COLORS.coneCalmEdge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawGuards(ctx, guards, t) {
  for (const g of guards) {
    const x = g.x;
    const y = FIELD_Y + g.y;
    const alert = g.state === 'alert';
    drawCone(ctx, x, y, g.facing, CONE_HALF_ANGLE, CONE_RANGE, alert);
  }
  for (const g of guards) {
    const x = g.x;
    const y = FIELD_Y + g.y;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + 9, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.guard;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.guardDark;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Cap brim + facing tick.
    ctx.strokeStyle = '#dbeafe';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(g.facing) * 14, y + Math.sin(g.facing) * 14);
    ctx.stroke();
    // Suspicion arc above the head.
    if (g.suspicion > 0.05) {
      ctx.strokeStyle = g.suspicion >= 1 ? COLORS.alarmHigh : COLORS.hudGold;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y - 18, 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * g.suspicion);
      ctx.stroke();
    }
    if (g.state === 'alert') {
      ctx.fillStyle = COLORS.alarmHigh;
      ctx.font = 'bold 18px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', x, y - 24);
    } else if (g.state === 'investigate') {
      ctx.fillStyle = COLORS.hudGold;
      ctx.font = 'bold 16px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', x, y - 24);
    }
  }
}

function drawCameras(ctx, cameras, t) {
  for (const c of cameras) {
    const x = c.x;
    const y = FIELD_Y + c.y;
    drawCone(ctx, x, y, c.angle, CAM_CONE_HALF_ANGLE, CAM_CONE_RANGE, c.seesThief);
  }
  for (const c of cameras) {
    const x = c.x;
    const y = FIELD_Y + c.y;
    ctx.fillStyle = COLORS.camera;
    ctx.fillRect(x - 7, y - 7, 14, 14);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 7, y - 7, 14, 14);
    const blink = c.seesThief ? 1 : 0.5 + 0.5 * Math.sin(t * 3);
    ctx.fillStyle = `rgba(239, 68, 68, ${blink})`;
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawThief(ctx, thief, t) {
  const x = thief.x;
  const y = FIELD_Y + thief.y;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + 9, 10, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.thief;
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.thiefDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Mask band + facing tick.
  ctx.strokeStyle = '#0f766e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 7, y - 2);
  ctx.lineTo(x + 7, y - 2);
  ctx.stroke();
  ctx.strokeStyle = '#ecfdf5';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(thief.facing) * 13, y + Math.sin(thief.facing) * 13);
  ctx.stroke();
}

function drawToolsFx(ctx, tools, t) {
  for (const s of tools.smokes) {
    ctx.fillStyle = COLORS.smoke;
    ctx.beginPath();
    ctx.arc(s.x, FIELD_Y + s.y, s.radius * (0.9 + 0.1 * Math.sin(t * 5)), 0, Math.PI * 2);
    ctx.fill();
  }
  for (const n of tools.noises) {
    const p = 1 - n.left / 3;
    ctx.strokeStyle = `rgba(245, 197, 66, ${0.9 - p * 0.7})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(n.x, FIELD_Y + n.y, 12 + p * 46, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = COLORS.hudGold;
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('BEEP', n.x, FIELD_Y + n.y - 16);
  }
}

function alarmColor(v) {
  if (v < 40) return COLORS.alarmLow;
  if (v < 70) return COLORS.alarmMid;
  return COLORS.alarmHigh;
}

export function drawHUD(ctx, s) {
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, CANVAS_W, HUD_H);
  ctx.strokeStyle = COLORS.wallTrim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, HUD_H);
  ctx.lineTo(CANVAS_W, HUD_H);
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.title;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText(s.room.name, 14, 24);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '12px Georgia, serif';
  ctx.fillText(`LOOT $${s.lootValue} / $${s.room.requiredLoot}`, 14, 44);
  // Alarm meter.
  const ax = 400;
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 12px Georgia, serif';
  ctx.fillText('ALARM', ax, 24);
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(ax, 30, 150, 14);
  ctx.fillStyle = alarmColor(s.alarm);
  ctx.fillRect(ax, 30, 150 * Math.min(1, s.alarm / ALARM_MAX), 14);
  ctx.strokeStyle = COLORS.hudGold;
  ctx.lineWidth = 1;
  ctx.strokeRect(ax, 30, 150, 14);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '11px Georgia, serif';
  ctx.fillText(`${Math.round(s.alarm)}%`, ax + 156, 42);
  // Timer, tools, coins.
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText(fmtTime(s.elapsed), 600, 34);
  ctx.font = '12px Georgia, serif';
  ctx.fillText(`SMOKE x${s.tools.smoke} [Q]`, 650, 26);
  ctx.fillText(`NOISE x${s.tools.noise} [click]`, 650, 44);
  ctx.fillStyle = COLORS.hudGold;
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText(`COINS ${s.coins}`, 830, 34);
}

export function drawGame(ctx, s, t) {
  drawFloor(ctx, t);
  drawWallsAndCover(ctx, s.room);
  const unlocked = s.lootValue >= s.room.requiredLoot;
  drawExit(ctx, s.room, unlocked, t);
  drawLoot(ctx, s.loot, t);
  drawCameras(ctx, s.cameras, t);
  drawGuards(ctx, s.guards, t);
  drawThief(ctx, s.thief, t);
  drawToolsFx(ctx, s.tools, t);
  drawHUD(ctx, s);
  // Banners.
  ctx.textAlign = 'center';
  if (s.banner) {
    ctx.fillStyle = s.banner.color;
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText(s.banner.text, CANVAS_W / 2, FIELD_Y + 34);
  } else if (unlocked && s.phase === 'play') {
    ctx.fillStyle = COLORS.exit;
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText('GETAWAY! Reach the green exit!', CANVAS_W / 2, FIELD_Y + 34);
  }
  if (s.phase === 'paused') {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 34px Georgia, serif';
    ctx.fillText('PAUSED — press P to continue', CANVAS_W / 2, CANVAS_H / 2);
  }
}

function overlay(ctx, alpha) {
  ctx.fillStyle = `rgba(5, 8, 14, ${alpha})`;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

export function drawTitle(ctx, t) {
  ctx.fillStyle = '#0b0f16';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // Gallery doors motif.
  ctx.strokeStyle = COLORS.wallTrim;
  ctx.lineWidth = 3;
  ctx.strokeRect(120, 90, CANVAS_W - 240, CANVAS_H - 180);
  ctx.strokeStyle = 'rgba(138, 109, 59, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(136, 106, CANVAS_W - 272, CANVAS_H - 212);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.title;
  ctx.font = 'bold 52px Georgia, serif';
  ctx.fillText(GAME_NAME, CANVAS_W / 2, 210);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'italic 20px Georgia, serif';
  ctx.fillText(GALLERY_NAME, CANVAS_W / 2, 248);
  ctx.font = '15px Georgia, serif';
  ctx.fillText(`You are ${THIEF_NAME}, gentleman thief. Three rooms. One night. No alarms.`, CANVAS_W / 2, 300);
  ctx.fillText('WASD / arrows — move      Q — smoke bomb      Click — throw noise maker', CANVAS_W / 2, 336);
  ctx.fillText('Stay out of the yellow cones. Cameras raise the alarm faster.', CANVAS_W / 2, 362);
  ctx.fillText('Fill the loot target, then reach the green exit. Plan first — it pays off.', CANVAS_W / 2, 388);
  const blink = 0.6 + 0.4 * Math.sin(t * 3);
  ctx.fillStyle = `rgba(245, 197, 66, ${blink})`;
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('Click or press Enter to plan the heist', CANVAS_W / 2, 460);
}

// Planning layout: route cards + tool shop + start button. Shared by
// drawPlanning and by main.js, so clicks land where the eye expects.
export function planningLayout() {
  const cardW = 280;
  const cardH = 150;
  const gap = 20;
  const totalW = cardW * 3 + gap * 2;
  const x0 = (CANVAS_W - totalW) / 2;
  const routes = [0, 1, 2].map((i) => ({ x: x0 + i * (cardW + gap), y: 150, w: cardW, h: cardH }));
  return {
    routes,
    smokeBuy: { x: CANVAS_W / 2 - 260, y: 340, w: 240, h: 44 },
    noiseBuy: { x: CANVAS_W / 2 + 20, y: 340, w: 240, h: 44 },
    start: { x: CANVAS_W / 2 - 170, y: 420, w: 340, h: 52 },
  };
}

export function drawPlanning(ctx, s, t) {
  overlay(ctx, 0.92);
  const L = planningLayout();
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.title;
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText(`PLANNING — ${s.room.name}`, CANVAS_W / 2, 84);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'italic 15px Georgia, serif';
  ctx.fillText(s.room.intro, CANVAS_W / 2, 112);
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText('Choose your way in  (keys 1 / 2 / 3, or click)', CANVAS_W / 2, 136);
  s.room.routes.forEach((r, i) => {
    const box = L.routes[i];
    const sel = s.planning.selected === i;
    ctx.fillStyle = sel ? '#3a2f12' : COLORS.panel;
    roundRect(ctx, box.x, box.y, box.w, box.h, 8);
    ctx.fill();
    ctx.strokeStyle = sel ? COLORS.hudGold : COLORS.panelEdge;
    ctx.lineWidth = sel ? 3 : 1.5;
    ctx.stroke();
    ctx.fillStyle = COLORS.hudGold;
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText(`Route ${r.id} — ${r.name}`, box.x + box.w / 2, box.y + 30);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = '13px Georgia, serif';
    wrapText(ctx, r.desc, box.x + box.w / 2, box.y + 58, box.w - 24, 18);
  });
  // Tool shop.
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText(`Tool shop — you hold ${s.coins} coins`, CANVAS_W / 2, 330);
  drawBuyButton(ctx, L.smokeBuy, `SMOKE BOMB  $${TOOL_PRICES.smoke}  (have ${s.tools.smoke})`, 'S');
  drawBuyButton(ctx, L.noiseBuy, `NOISE MAKER  $${TOOL_PRICES.noise}  (have ${s.tools.noise})`, 'N');
  const start = L.start;
  ctx.fillStyle = COLORS.exit;
  roundRect(ctx, start.x, start.y, start.w, start.h, 8);
  ctx.fill();
  ctx.fillStyle = '#052e16';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText('BEGIN THE HEIST  [Enter]', CANVAS_W / 2, start.y + 32);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '12px Georgia, serif';
  ctx.fillText('Loot from earlier rooms becomes coins. Smoke hides you; noise pulls guards away.', CANVAS_W / 2, 510);
}

function drawBuyButton(ctx, box, label, key) {
  ctx.fillStyle = COLORS.panel;
  roundRect(ctx, box.x, box.y, box.w, box.h, 6);
  ctx.fill();
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, box.x + box.w / 2, box.y + 27);
  ctx.fillStyle = COLORS.hudGold;
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`[${key}]`, box.x + 8, box.y + 16);
}

function wrapText(ctx, text, cx, y, maxW, lineH) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, cx, y + i * lineH));
}

export function drawCaught(ctx, s) {
  overlay(ctx, 0.75);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.alarmHigh;
  ctx.font = 'bold 46px Georgia, serif';
  ctx.fillText('CAUGHT!', CANVAS_W / 2, 260);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '18px Georgia, serif';
  ctx.fillText(s.caughtReason || 'The alarm hit 100%. The gallery locks down.', CANVAS_W / 2, 300);
  ctx.font = '15px Georgia, serif';
  ctx.fillText(`Loot kept: $${s.lootValue}   •   Alarm: ${Math.round(s.alarm)}%   •   Time: ${fmtTime(s.elapsed)}`, CANVAS_W / 2, 340);
  ctx.fillStyle = COLORS.hudGold;
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillText('Press R to retry the room — your plan and tools stay bought', CANVAS_W / 2, 400);
}

export function drawWin(ctx, s) {
  overlay(ctx, 0.8);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.title;
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText('THE VAULT IS YOURS', CANVAS_W / 2, 200);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'italic 18px Georgia, serif';
  ctx.fillText('Wren slips into the night with the Hourglass of Velmora.', CANVAS_W / 2, 238);
  ctx.font = '16px Georgia, serif';
  const lines = [
    `Loot stolen: $${s.score.loot}`,
    `Time bonus: $${s.score.timeBonus}  (finished in ${fmtTime(s.score.time)})`,
    `Stealth bonus: $${s.score.stealthBonus}  (alarm ended at ${Math.round(s.score.alarm)}%)`,
    `Tools left: $${s.score.toolBonus}`,
    `FINAL SCORE: $${s.score.total}`,
  ];
  lines.forEach((l, i) => {
    ctx.fillStyle = i === lines.length - 1 ? COLORS.hudGold : COLORS.hudText;
    ctx.font = i === lines.length - 1 ? 'bold 22px Georgia, serif' : '16px Georgia, serif';
    ctx.fillText(l, CANVAS_W / 2, 290 + i * 32);
  });
  ctx.fillStyle = COLORS.hudGold;
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillText('Press Enter to plan it all again', CANVAS_W / 2, 500);
}
