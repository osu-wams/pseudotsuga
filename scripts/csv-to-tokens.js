// Node 18+
import fs from 'node:fs'; 
import path from 'node:path'; 
import { parse } from 'csv-parse/sync';

/**
 * Assumptions about CSV columns:
 * collection,mode,name,type,value
 * Example row:
 * Theme,Light,color/bg,color,#FFFFFF
 * Theme,Dark,color/bg,color,#000000
 */
const input = fs.readFileSync('tokens/Variables.csv', 'utf8'); 
const rows = parse(input, {
  columns: header => header.map(h => h.trim()),
  skip_empty_lines: true
});

// group by mode 
const byMode = new Map(); 
for (const r of rows) { 
  const mode = (r.Mode ?? 'Default').trim(); 
  const rawName = r.Name?.trim(); // e.g., "color/bg" or "color.bg" 
  const type = (r.Type ?? '').trim().toLowerCase(); 
  const value = r.Value?.trim(); 
  if (!value || !rawName) continue;

  // normalize token path: split on "/" or "." 
  const segments = rawName.split(/[/.]/g).filter(Boolean); 
  if (!byMode.has(mode)) { 
    byMode.set(mode, {}); // root object for tokens under this mode 
  } 
  const root = byMode.get(mode);

  // Walk/build nested object, and assign $type at the nearest sensible group: 
  let cursor = root; 
  for (let i = 0; i < segments.length; i++) { 
    const seg = segments[i]; 
    // If last segment, set the token 
    if (i === segments.length - 1) { 
      if (!cursor[seg]) cursor[seg] = {}; 
      if (type) { 
        // Optionally set $type on the group level above when sensible 
        // For simplicity, set $type on the immediate parent if empty 
        if (!cursor.$type && ['color', 'number', 'dimension', 'string'].includes(type)) { 
          cursor.$type = type; 
        } 
      } 
      cursor[seg].$value = coerce(value, type); 
    } else { 
      if (!cursor[seg]) cursor[seg] = {}; 
      cursor = cursor[seg]; 
    } 
  } 
}

function coerce(v, t) { 
  // You can expand this if you need typed values (e.g., "16px" as dimension) 
  if (t === 'number') { 
    const n = Number(v); 
    return Number.isFinite(n) ? n : v; 
  } 
  return v; 
}

// Write one tokens file per mode 
fs.mkdirSync('tokens', { recursive: true }); 
for (const [mode, obj] of byMode.entries()) { 
  const out = JSON.stringify(obj, null, 2); 
  fs.writeFileSync(path.join('tokens', `${mode.toLowerCase()}.tokens.json`), out, 'utf8'); 
  console.log(`Wrote tokens/${mode.toLowerCase()}.tokens.json`); 
}
