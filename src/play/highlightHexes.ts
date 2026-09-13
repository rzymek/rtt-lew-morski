import {isEmpty} from "./utils/isEmpty";

export function highlightHexes(hexes: string[] | undefined, color: string) {
  const cssOverrides = document.getElementById('cssOverrides')!;
  if (isEmpty(hexes)) {
    return;
  }
  cssOverrides.textContent += `
    ${(hexes).map(id => `#${CSS.escape(id)}`).join(',')} {
        --hex-fill: ${color};
  }`
}

export function clearHexHighlights() {
  document.getElementById('cssOverrides')!.textContent = '';
}