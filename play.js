"use strict"
const R_Niem = 0
const R_Bryt = 1
// on_init is called once when the client connects.
// Use it to set up DOM event listeners and any one-time initialization.
// Parameters: scenario (string), options (object), static_view (from on_static_view in rules)
let planePlaceholder = null

function on_init(scenario, options, static_view) {
	console.log({scenario, options, static_view})
	planePlaceholder = document.getElementById("plane-placeholder")
	planePlaceholder.remove()
	toggle_zoom()
}

// Centroid of the template hex path vertices in its local coordinate system.
// Computed from: d="m48.82 56.811-16.011-0.07172-7.9435-13.902 8.0678-13.83 16.011 0.07172 7.9435 13.902z"
const TEMPLATE_CENTER = new DOMPoint(40.877, 42.909)
const NS_XLINK = 'http://www.w3.org/1999/xlink'

function parseSVGTransform(str) {
	const m = str && str.match(/matrix\((.*?)\)/)
	if (m) return new DOMMatrix(m[1].trim().split(/[\s,]+/).map(Number))
	const t = str && str.match(/translate\((.*?)\)/)
	if (t) {
		const [x, y = 0] = t[1].trim().split(/[\s,]+/).map(Number)
		return new DOMMatrix().translate(x, y)
	}
	return new DOMMatrix()
}

function getHexCenterInSVGCoords(hexId) {
	const templateEl = document.getElementById('use26613')
	const useEl = document.getElementById(hexId)
	const hexesGroup = document.getElementById('hexes')
	const templateMatrix = parseSVGTransform(templateEl.getAttribute('transform'))
	const useMatrix = parseSVGTransform(useEl.getAttribute('transform'))
	const groupMatrix = parseSVGTransform(hexesGroup.getAttribute('transform'))
	return groupMatrix.multiply(useMatrix).multiply(templateMatrix).transformPoint(TEMPLATE_CENTER)
}

// on_update is called every time the view changes (after each action, on connect, etc.)
// The global `view` holds the latest view object from rules.js on_view().
// The global `player` holds the current role name ("X", "O", or "Observer").
function on_update() {
	console.log({view, player, planePlaceholder})
	const unitsLayer = document.getElementById("units")

	unitsLayer.innerHTML = ""
	// while (unitsLayer.firstChild) unitsLayer.removeChild(unitsLayer.firstChild)

	const imgW = parseFloat(planePlaceholder.getAttribute('width'))
	const imgH = parseFloat(planePlaceholder.getAttribute('height'))

	Object.values(view.board.planes).flat().forEach(plane => {
		const center = getHexCenterInSVGCoords(plane.at)
		const imgSrc = `./${plane.plane.img}.jpg`

		const clone = planePlaceholder.cloneNode(false)
		clone.removeAttribute('id')
		clone.setAttributeNS(NS_XLINK, 'xlink:href', imgSrc)
		clone.setAttribute('href', imgSrc)
		clone.setAttribute('x', center.x - imgW / 2)
		clone.setAttribute('y', center.y - imgH / 2)

		clone.setAttribute('transform', `rotate(${plane.direction * 60}, ${center.x}, ${center.y})`)

		unitsLayer.appendChild(clone)
	})
}