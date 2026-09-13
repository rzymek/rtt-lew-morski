export function createSvgMarkerAt(center: DOMPoint, svgText: string) {
  const svgDoc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const jammedEl = svgDoc.documentElement as unknown as SVGSVGElement
  const jammedW = parseFloat(jammedEl.getAttribute('width')!)
  const jammedH = parseFloat(jammedEl.getAttribute('height')!)
  jammedEl.setAttribute('x', String(center.x - jammedW / 2))
  jammedEl.setAttribute('y', String(center.y - jammedH / 2))
  return document.adoptNode(jammedEl);
}