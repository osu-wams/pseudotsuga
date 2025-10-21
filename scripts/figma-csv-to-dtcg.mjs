// Node 18+ ESM
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';

// INPUT/OUTPUT
const inCsv = process.argv[2] || '../tokens/Variables.csv';
const outDir = '../tokens';

// Helpers
const kebab = s => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g,'');
const normGroup = g => g.replace(/^\s+|\s+$/g,'').replace(/^\/+|\/+$/g,''); // trim & strip slashes
const hex8 = v => {
  let vv = v.trim().toLowerCase();
  // your CSV has 8-hex without '#', e.g., d73f09ff
  if (/^[0-9a-f]{8}$/.test(vv)) return '#' + vv;
  if (/^#[0-9a-f]{8}$/.test(vv)) return vv;
  return vv; // leave aliases etc. unchanged
};

const csv = fs.readFileSync(inCsv, 'utf8');
const rows = parse(csv, { columns: true, skip_empty_lines: true });

// Build an ID → tokenPath map (for resolving aliases)
const idToPath = new Map();

// Build per-mode token trees
const byMode = new Map();

for (const r of rows) {
  const collection = (r['Collection'] || '').trim();          // e.g., "Primitives", "Tokens"
  const groupRaw   = (r['Group'] || '').trim();                // e.g., "colors/brand/"
  const nameRaw    = (r['Name']  || '').trim();                // e.g., "beaver orange"
  const typeRaw    = (r['Type']  || '').trim().toLowerCase();  // e.g., "color"
  const mode       = (r['Mode']  || 'Default').trim();         // e.g., "Mode 1"
  const val        = (r['Value'] || '').trim();
  const id         = (r['ID']    || '').trim();

  // Normalize path: group segments + kebab-case name
  const group = normGroup(groupRaw);                          // "colors/brand"
  const name  = kebab(nameRaw);                               // "beaver-orange"
  const pathSegs = (group ? group.split('/') : []).filter(Boolean);
  const tokenPathSegs = [...pathSegs, name];                  // ["colors","brand","beaver-orange"]

  // Where to store for this mode
  if (!byMode.has(mode)) byMode.set(mode, {});
  const root = byMode.get(mode);

  // Walk/create nested objects
  let cursor = root;
  for (let i = 0; i < tokenPathSegs.length; i++) {
    const seg = tokenPathSegs[i];
    if (i === tokenPathSegs.length - 1) {
      cursor[seg] = cursor[seg] || {};
      // Set $type at parent if sensible
      if (typeRaw && !cursor.$type) cursor.$type = typeRaw;
      // Resolve value
      if (val.startsWith('type:VARIABLE_ALIAS')) {
        // Extract alias target ID
        const m = val.match(/id:VariableID:(.+)$/);
        if (m) {
          cursor[seg].$value = `{${'__ALIAS__:' + m[1]}}`; // temp marker to resolve later
          cursor[seg].$type = typeRaw || 'string';
        } else {
          cursor[seg].$value = val; // fallback
          cursor[seg].$type = typeRaw || 'string';
        }
      } else {
        // Literal
        cursor[seg].$value = (typeRaw === 'color') ? hex8(val) : val;
        cursor[seg].$type = typeRaw || 'string';
      }
    } else {
      cursor[seg] = cursor[seg] || {};
      // optionally set group-level $type = typeRaw if uniform; we keep it minimal
      cursor = cursor[seg];
    }
  }

  // Save mapping from ID → token path (dot notation)
  if (id) {
    const dotPath = tokenPathSegs.join('.');
    idToPath.set(id, dotPath);
  }
}

// Second pass: resolve alias placeholders to token paths
function resolveAliases(obj) {
  for (const [k, v] of Object.entries(obj)) {
    if (k === '$value' && typeof v === 'string' && v.startsWith('{__ALIAS__:')) {
      const id = v.slice('{__ALIAS__:'.length, -1);
      const targetPath = idToPath.get(id);
      if (targetPath) {
        obj[k] = `{${targetPath}}`; // Style Dictionary-compatible reference
      } else {
        // leave as-is if unresolved
        obj[k] = v;
      }
    } else if (v && typeof v === 'object') {
      resolveAliases(v);
    }
  }
}
for (const modeObj of byMode.values()) resolveAliases(modeObj);

// Write per-mode tokens
fs.mkdirSync(outDir, { recursive: true });
for (const [mode, data] of byMode.entries()) {
  const fileSafe = kebab(mode); // "mode-1"
  fs.writeFileSync(path.join(outDir, `${fileSafe}.tokens.json`), JSON.stringify(data, null, 2));
  console.log(`Wrote tokens/${fileSafe}.tokens.json`);
}
