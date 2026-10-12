// Builds the blank console (sliceworks-player-*.html) from the engine:
// the same page, booted in player mode with no cartridge inside.
//   node tools/build-player.mjs sliceworks-engine-v0.6.html sliceworks-player-v0.2.html
import { readFileSync, writeFileSync } from 'node:fs';
const [src, out] = process.argv.slice(2);
if (!src || !out) { console.error('usage: node tools/build-player.mjs <engine.html> <player.html>'); process.exit(1); }
let html = readFileSync(src, 'utf8');
html = html.replace(/<title>[^<]*<\/title>/, '<title>SliceWorks Player — ConsciousNode SoftWorks</title>')
           .replace('</head>', '<script>window.SLICE_PLAYER=true;</script>\n</head>');
writeFileSync(out, html);
console.log(`wrote ${out} (${html.length} bytes)`);
