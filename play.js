"use strict"
const R_Niem = 0
const R_Bryt = 1

const TEMPLATE_CENTER = new DOMPoint(40.877, 42.909)
const NS_XLINK = 'http://www.w3.org/1999/xlink'

let planePlaceholder = null
let hexOverlay = null

function on_init(scenario, options, static_view) {
	planePlaceholder = document.getElementById("plane-placeholder")
	planePlaceholder.remove()
	toggle_zoom()

	// Click on a hex → send move_hex if it's a valid target
	document.querySelectorAll('#hexes use').forEach(el => {
		el.addEventListener('click', () => {
			if (view.actions?.move_hex?.includes(el.id))
				send_action("move_hex", el.id)
		})
	})

	// SVG overlay layer for hex highlights, inserted just before the units layer
	const svg = document.querySelector('#mapwrap svg')
	hexOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'g')
	hexOverlay.id = 'hex-overlay'
	svg.insertBefore(hexOverlay, document.getElementById('units'))
}

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

// eslint-disable-next-line no-unused-vars
function on_update() {
	action_button("undo", "Undo")

	const svgNS = 'http://www.w3.org/2000/svg'

	// Update cursor class on hex elements
	document.querySelectorAll('#hexes use.action').forEach(el => el.classList.remove('action'))
	if (view.actions?.move_hex) {
		for (const id of view.actions.move_hex) {
			const el = document.getElementById(id)
			if (el) el.classList.add('action')
		}
	}

	// Overlay circles: selected plane (yellow ring) + valid move targets (green fill)
	hexOverlay.innerHTML = ""

	if (view.selected_at) {
		const center = getHexCenterInSVGCoords(view.selected_at)
		const c = document.createElementNS(svgNS, 'circle')
		c.setAttribute('cx', center.x)
		c.setAttribute('cy', center.y)
		c.setAttribute('r', '12')
		c.setAttribute('fill', 'none')
		c.setAttribute('stroke', 'yellow')
		c.setAttribute('stroke-width', '2')
		c.style.pointerEvents = 'none'
		hexOverlay.appendChild(c)
	}

	if (view.actions?.move_hex) {
		for (const id of view.actions.move_hex) {
			if (!document.getElementById(id)) continue
			const center = getHexCenterInSVGCoords(id)
			const c = document.createElementNS(svgNS, 'circle')
			c.setAttribute('cx', center.x)
			c.setAttribute('cy', center.y)
			c.setAttribute('r', '11')
			c.setAttribute('fill', 'rgba(0,200,0,0.35)')
			c.setAttribute('stroke', '#00cc00')
			c.setAttribute('stroke-width', '1.5')
			c.style.pointerEvents = 'none'
			hexOverlay.appendChild(c)
		}
	}

	// Draw planes
	const unitsLayer = document.getElementById("units")
	unitsLayer.innerHTML = ""

	const imgW = parseFloat(planePlaceholder.getAttribute('width'))
	const imgH = parseFloat(planePlaceholder.getAttribute('height'))

	Object.entries(view.board.planes).forEach(([roleStr, planes]) => {
		const roleIdx = parseInt(roleStr)
		const isActiveSide = roleIdx === view.active_side

		planes.forEach((plane, idx) => {
			if (!document.getElementById(plane.at)) return

			const center = getHexCenterInSVGCoords(plane.at)
			const imgSrc = `./${plane.plane.img}.jpg`

			const clone = planePlaceholder.cloneNode(false)
			clone.removeAttribute('id')
			clone.setAttributeNS(NS_XLINK, 'xlink:href', imgSrc)
			clone.setAttribute('href', imgSrc)
			clone.setAttribute('x', center.x - imgW / 2)
			clone.setAttribute('y', center.y - imgH / 2)
			clone.setAttribute('transform', `rotate(${plane.direction * 60}, ${center.x}, ${center.y})`)

			if (isActiveSide && view.actions?.select_plane?.includes(idx)) {
				clone.style.cursor = 'pointer'
				clone.addEventListener('click', e => {
					e.stopPropagation()
					send_action("select_plane", idx)
				})
			}

			unitsLayer.appendChild(clone)
		})
	})
}
