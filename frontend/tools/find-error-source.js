const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', 'node_modules');
const search = 'not an absolute path';
const exts = new Set(['.js', '.mjs', '.cjs', '.ts', '.json', '.mts']);
let count = 0;
function walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
  for (const e of entries) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) {
      // skip nested node_modules inside some packages to speed up
      if (e.name === 'node_modules') continue;
      walk(fp);
    } else {
      const ext = path.extname(e.name);
      if (!exts.has(ext)) continue;
      let content;
      try { content = fs.readFileSync(fp, 'utf8'); } catch (err) { continue; }
      if (content && content.includes(search)) {
        count++;
        console.log('=== MATCH ===');
        console.log(fp);
        const idx = content.indexOf(search);
        const start = Math.max(0, idx - 200);
        const snippet = content.slice(start, idx + search.length + 200);
        console.log(snippet);
        // stop early if many matches
        if (count >= 20) return;
      }
    }
  }
}
console.log('Searching for:', search, 'under', root);
walk(root);
console.log('Done. matches:', count);
