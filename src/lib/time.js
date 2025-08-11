export function nowAwst() {
return new Date(new Date().toLocaleString('en-US', { timeZone: 'Australia/Perth' }));
}

export function formatAwst(dateLike) {
if (!dateLike) return '';
const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
const s = d.toLocaleString('en-AU', {
timeZone: 'Australia/Perth',
year: 'numeric', month: '2-digit', day: '2-digit',
hour: '2-digit', minute: '2-digit'
});
return `${s} AWST`;
}

export function firstDefined(...vals) {
for (const v of vals) if (v !== undefined && v !== null && v !== '') return v;
return undefined;
}
