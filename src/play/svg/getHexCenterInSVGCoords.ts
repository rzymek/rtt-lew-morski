import {parseSVGTransform} from "./parseSVGTransform";

const TEMPLATE_CENTER = new DOMPoint(40.877, 42.909)

export function getHexCenterInSVGCoords(hexId: string): DOMPoint {
  const templateEl = document.getElementById('hexTemplate')!
  const useEl = document.getElementById(hexId)!
  const hexesGroup = document.getElementById('hexes')!
  const templateMatrix = parseSVGTransform(templateEl.getAttribute('transform'))
  const useMatrix = parseSVGTransform(useEl.getAttribute('transform'))
  const groupMatrix = parseSVGTransform(hexesGroup.getAttribute('transform'))
  return groupMatrix.multiply(useMatrix).multiply(templateMatrix).transformPoint(TEMPLATE_CENTER)
}