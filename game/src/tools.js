// The Gilded Hour — the thief's tools.
// One job: smoke bombs and noise makers — what they cost, what they do,
// and how long they last. Both are bought in the planning phase.
import { SMOKE_SECONDS, SMOKE_RADIUS, NOISE_SECONDS, TOOL_PRICES } from './config.js';

export function makeTools(stock) {
  return {
    smoke: stock.smoke,
    noise: stock.noise,
    smokes: [], // { x, y, radius, left }
    noises: [], // { x, y, left }
  };
}

export function dropSmoke(tools, x, y) {
  if (tools.smoke <= 0) return false;
  tools.smoke -= 1;
  tools.smokes.push({ x, y, radius: SMOKE_RADIUS, left: SMOKE_SECONDS });
  return true;
}

export function throwNoise(tools, x, y) {
  if (tools.noise <= 0) return false;
  tools.noise -= 1;
  tools.noises.push({ x, y, left: NOISE_SECONDS });
  return true;
}

export function updateTools(tools, dt) {
  for (const s of tools.smokes) s.left -= dt;
  tools.smokes = tools.smokes.filter((s) => s.left > 0);
  for (const n of tools.noises) n.left -= dt;
  tools.noises = tools.noises.filter((n) => n.left > 0);
}

export function buyTool(tools, kind, coins) {
  const price = TOOL_PRICES[kind];
  if (coins < price) return { ok: false, coins };
  tools[kind] += 1;
  return { ok: true, coins: coins - price };
}

export function toolPrices() {
  return TOOL_PRICES;
}
