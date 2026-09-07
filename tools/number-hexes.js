/*
open ../app.svg
modify the ids of all the <svg:use> in layer with inkscape:label=hexes so that they match the hex coordinates of the undelaying image (../images/mapa.jpg)
using format A01.B01 (left-bottom, current id=use41481) to A42.B48 (right-top, current id=use42319).
remember to take into account transform matrix
 */

const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'app.svg');
let content = fs.readFileSync(svgPath, 'utf8');

// Derived from anchor hexes in the layer (element transform translation values, not absolute SVG coords):
//   A01.B01 = use41481: X=-216.47399, Y=965.9772
//   A42.B48 = use42319: X=770.29584,  Y=238.32863
// Columns run left→right with uniform X spacing.
// Rows run bottom→top; each successive column shifts the row baseline downward by y_half
// (the classic pointy-top hex grid stagger, but applied cumulatively per column
// because this map's rows are diagonal across the grid).
const X_A01   = -216.47399;
const Y_A01_B01 = 965.9772;
const X_A42   = 770.29584;
const xStep   = (X_A42 - X_A01) / 41;   // ~24.068
const yStep   = 27.45834;                // measured from column A01
const yHalf   = yStep / 2;              // ~13.729

function hexCoord(x, y) {
  const col = Math.round((x - X_A01) / xStep) + 1;
  if (col < 0 || col > 100) return null;
  const row = Math.round((Y_A01_B01 + (col - 1) * yHalf - y) / yStep) + 1;
  if (row < 0 || row > 100) return null;
  return `A${String(col).padStart(2, '0')}.B${String(row).padStart(2, '0')}`;
}

// Isolate the hexes layer so we don't touch anything outside it.
const hexesLabelPos = content.indexOf('inkscape:label="hexes"');
const layerStart    = content.lastIndexOf('<g', hexesLabelPos);
const layerEnd      = content.indexOf('</g>', hexesLabelPos) + 4;

const before = content.slice(0, layerStart);
const layer  = content.slice(layerStart, layerEnd);
const after  = content.slice(layerEnd);

// Match only the tiled-clone <use> elements (matrix with a=0, d=0).
// The original hex <path> has a full matrix (a≠0, d≠0) and must not be renamed.
let renamed = 0;
let skipped = 0;

const modifiedLayer = layer.replace(
  /transform="matrix\(0,([^,]+),([^,]+),0,([^,]+),([^)]+)\)"\s+id="use\d+"/g,
  (match, b, c, eStr, fStr) => {
    const x = parseFloat(eStr);
    const y = parseFloat(fStr);
    const newId = hexCoord(x, y);
    if (newId) {
      renamed++;
      return `transform="matrix(0,${b},${c},0,${eStr},${fStr})" id="${newId}"`;
    }
    skipped++;
    return match;
  }
);

fs.writeFileSync(svgPath, before + modifiedLayer + after);
console.log(`Renamed ${renamed} hexes, skipped ${skipped} out-of-range border hexes.`);