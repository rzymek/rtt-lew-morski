export function highlightHexes(hexes: string[] | undefined, color: string) {
  const cssOverrides = document.getElementById('cssOverrides')!;
  cssOverrides.innerText = `
      ${(hexes ?? []).map(id => `#${CSS.escape(id)}`).join(',')} {
        --hex-fill: ${color};
      }
  `;
}