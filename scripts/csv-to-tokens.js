import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';

// Read and parse CSV
const input = fs.readFileSync('tokens/Variables.csv', 'utf8');
const rows = parse(input, {
  columns: header => header.map(h => h.trim()),
  skip_empty_lines: true
});

// Build ID-to-path map
const idMap = new Map();
for (const r of rows) {
  const mode = (r.Mode ?? 'Default').trim();
  const rawName = r.Name?.trim();
  const group = r.Group?.trim();
  const id = r.ID?.trim();
  if (!rawName || !id) continue;

  const segments = [...(group ? group.split(/[/.]/).filter(Boolean) : []), ...rawName.split(/[/.]/).filter(Boolean)];
  const pathStr = segments.join('.');
  idMap.set(id, pathStr);
}

// Group tokens by mode
const byMode = new Map();
for (const r of rows) {
  const mode = (r.Mode ?? 'Default').trim();
  const rawName = r.Name?.trim();
  const group = r.Group?.trim();
  const type = (r.Type ?? '').trim().toLowerCase();
  const value = r.Value?.trim();
  const id = r.ID?.trim();
  if (!value || !rawName) continue;

  const segments = [...(group ? group.split(/[/.]/).filter(Boolean) : []), ...rawName.split(/[/.]/).filter(Boolean)];
  if (!byMode.has(mode)) {
    byMode.set(mode, {});
  }
  const root = byMode.get(mode);

  let cursor = root;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (i === segments.length - 1) {
      if (!cursor[seg]) cursor[seg] = {};
      if (type && !cursor.$type && ['color', 'number', 'dimension', 'string'].includes(type)) {
        cursor.$type = type;
      }

      if (value.startsWith('type:VARIABLE_ALIAS')) {
        const match = value.match(/id:VariableID:(\d+:\d+)/);
        if (match) {
          const refId = match[1];
          const refPath = idMap.get(refId);
          if (refPath) {
            cursor[seg].$type = type;
            cursor[seg].$alias = refPath;
          } else {
            cursor[seg].$value = value; // fallback
          }
        } else {
          cursor[seg].$value = value; // fallback
        }
      } else {
        cursor[seg].$value = coerce(value, type);
      }
    } else {
      if (!cursor[seg]) cursor[seg] = {};
      cursor = cursor[seg];
    }
  }
}

function coerce(v, t) {
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
``

