import { AEMO_API_BASE_URL } from '../config';

const BASE = AEMO_API_BASE_URL || '/api/report';

async function getJson(path, { retries = 3, timeoutMs = 12000 } = {}) {
let lastErr;
for (let i = 0; i < retries; i++) {
const controller = new AbortController();
const to = setTimeout(() => controller.abort(), timeoutMs);
try {
const res = await fetch(`${BASE}${path}`, { signal: controller.signal });
clearTimeout(to);
if (!res.ok) {
if (res.status === 404) return { error: `404 ${path}` };
throw new Error(`HTTP ${res.status}`);
}
try {
return await res.json();
} catch {
return { error: `Invalid JSON for ${path}` };
}
} catch (e) {
clearTimeout(to);
lastErr = e;
if (i < retries - 1) await new Promise(r => setTimeout(r, 500 * (i + 1)));
}
}
return { error: `Failed ${path}: ${lastErr?.message || 'unknown error'}` };
}

export async function getLinepackCapacityAdequacyCurrent() {
return getJson('/linepackCapacityAdequacy/current');
}

export async function getEndUserConsumptionCurrent() {
return getJson('/endUserConsumption/current');
}

export async function getCapacityOutlookCurrent() {
return getJson('/capacityOutlook/current');
}
