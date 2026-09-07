declare global {
	interface Window {
		on_init: (scenario: string, options: unknown, static_view: unknown) => void
		on_update: () => void
	}
}

interface ViewPlaneInstance {
	plane: { img: string }
	at: string
	direction: number
	damaged?: boolean
	destroyed?: boolean
	jammed?: boolean
}

interface View {
	board: { planes: Record<number, (ViewPlaneInstance | null)[]> }
	active_side: number
	actions?: {
		move_hex?: string[]
		select_plane?: number[]
		attack?: number
		unjam?: number
		undo?: number
		done?: number
	}
	unmoved?: number[]
	selected_at?: string
	fire_line?: string[]
	shot?: number[]
}

declare const view: View
declare function send_action(action: string, argument?: unknown): void
declare function action_button(action: string, label: string): void

const R_Niem = 0
const R_Bryt = 1

const TEMPLATE_CENTER = new DOMPoint(40.877, 42.909)
const NS_XLINK = 'http://www.w3.org/1999/xlink'

let planePlaceholder: SVGImageElement | null = null
let hexOverlay: SVGGElement | null = null

window.on_init = (_scenario, _options, _static_view) => {
	planePlaceholder = document.getElementById("plane-placeholder") as SVGImageElement
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
	const svg = document.querySelector('#mapwrap svg')!
	hexOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'g')
	hexOverlay.id = 'hex-overlay'
	svg.insertBefore(hexOverlay, document.getElementById('units'))
}

function parseSVGTransform(str: string | null): DOMMatrix {
	const m = str && str.match(/matrix\((.*?)\)/)
	if (m) return new DOMMatrix(m[1].trim().split(/[\s,]+/).map(Number))
	const t = str && str.match(/translate\((.*?)\)/)
	if (t) {
		const [x, y = 0] = t[1].trim().split(/[\s,]+/).map(Number)
		return new DOMMatrix().translate(x, y)
	}
	return new DOMMatrix()
}

function getHexCenterInSVGCoords(hexId: string): DOMPoint {
	const templateEl = document.getElementById('use26613')!
	const useEl = document.getElementById(hexId)!
	const hexesGroup = document.getElementById('hexes')!
	const templateMatrix = parseSVGTransform(templateEl.getAttribute('transform'))
	const useMatrix = parseSVGTransform(useEl.getAttribute('transform'))
	const groupMatrix = parseSVGTransform(hexesGroup.getAttribute('transform'))
	return groupMatrix.multiply(useMatrix).multiply(templateMatrix).transformPoint(TEMPLATE_CENTER)
}

declare function toggle_zoom(): void

window.on_update = () => {
	action_button("undo", "Undo")
	action_button("done", "Done")
	if (view.actions?.attack !== undefined)
		action_button("attack", "Atakuj!")
	if (view.actions?.unjam !== undefined)
		action_button("unjam", "Odblokuj karabiny")

	const svgNS = 'http://www.w3.org/2000/svg'

	document.querySelectorAll('#hexes use.action').forEach(el => el.classList.remove('action'))
	if (view.actions?.move_hex) {
		for (const id of view.actions.move_hex) {
			const el = document.getElementById(id)
			if (el) el.classList.add('action')
		}
	}

	hexOverlay!.innerHTML = ""

	// Orange rings: unmoved planes
	if (view.unmoved) {
		const activePlanes = view.board.planes[view.active_side] ?? []
		for (const idx of view.unmoved) {
			const plane = activePlanes[idx]
			if (!plane || !document.getElementById(plane.at)) continue
			const center = getHexCenterInSVGCoords(plane.at)
			const c = document.createElementNS(svgNS, 'circle')
			c.setAttribute('cx', String(center.x))
			c.setAttribute('cy', String(center.y))
			c.setAttribute('r', '14')
			c.setAttribute('fill', 'rgba(255,140,0,0.25)')
			c.setAttribute('stroke', 'orange')
			c.setAttribute('stroke-width', '2')
			c.style.pointerEvents = 'none'
			hexOverlay!.appendChild(c)
		}
	}

	// Yellow ring: selected plane
	if (view.selected_at) {
		const center = getHexCenterInSVGCoords(view.selected_at)
		const c = document.createElementNS(svgNS, 'circle')
		c.setAttribute('cx', String(center.x))
		c.setAttribute('cy', String(center.y))
		c.setAttribute('r', '12')
		c.setAttribute('fill', 'none')
		c.setAttribute('stroke', 'yellow')
		c.setAttribute('stroke-width', '2')
		c.style.pointerEvents = 'none'
		hexOverlay!.appendChild(c)
	}

	// Green fill: valid move targets
	if (view.actions?.move_hex) {
		for (const id of view.actions.move_hex) {
			if (!document.getElementById(id)) continue
			const center = getHexCenterInSVGCoords(id)
			const c = document.createElementNS(svgNS, 'circle')
			c.setAttribute('cx', String(center.x))
			c.setAttribute('cy', String(center.y))
			c.setAttribute('r', '11')
			c.setAttribute('fill', 'rgba(0,200,0,0.35)')
			c.setAttribute('stroke', '#00cc00')
			c.setAttribute('stroke-width', '1.5')
			c.style.pointerEvents = 'none'
			hexOverlay!.appendChild(c)
		}
	}

	// Red fill: fire line of selected plane
	if (view.fire_line) {
		for (const id of view.fire_line) {
			if (!document.getElementById(id)) continue
			const center = getHexCenterInSVGCoords(id)
			const c = document.createElementNS(svgNS, 'circle')
			c.setAttribute('cx', String(center.x))
			c.setAttribute('cy', String(center.y))
			c.setAttribute('r', '11')
			c.setAttribute('fill', 'rgba(255,50,50,0.22)')
			c.setAttribute('stroke', '#ff4444')
			c.setAttribute('stroke-width', '1.5')
			c.style.pointerEvents = 'none'
			hexOverlay!.appendChild(c)
		}
	}

	// Draw planes
	const unitsLayer = document.getElementById("units")!
	unitsLayer.innerHTML = ""

	const imgW = parseFloat(planePlaceholder!.getAttribute('width')!)
	const imgH = parseFloat(planePlaceholder!.getAttribute('height')!)

	Object.entries(view.board.planes).forEach(([roleStr, planes]) => {
		const roleIdx = parseInt(roleStr)
		const isActiveSide = roleIdx === view.active_side

		planes.forEach((plane, idx) => {
			if (!plane || plane.destroyed) return
			if (!document.getElementById(plane.at)) return

			const center = getHexCenterInSVGCoords(plane.at)
			const imgSrc = `./${plane.plane.img}.jpg`

			const clone = planePlaceholder!.cloneNode(false) as SVGImageElement
			clone.removeAttribute('id')
			clone.setAttributeNS(NS_XLINK, 'xlink:href', imgSrc)
			clone.setAttribute('href', imgSrc)
			clone.setAttribute('x', String(center.x - imgW / 2))
			clone.setAttribute('y', String(center.y - imgH / 2))
			clone.setAttribute('transform', `rotate(${plane.direction * 60}, ${center.x}, ${center.y})`)

			// Dim planes that have already shot this phase
			const hasShot = view.shot?.includes(idx)
			if (isActiveSide && hasShot && !plane.damaged)
				clone.setAttribute('opacity', '0.55')

			if (isActiveSide && view.actions?.select_plane?.includes(idx)) {
				clone.style.cursor = 'pointer'
				clone.addEventListener('click', e => {
					e.stopPropagation()
					send_action("select_plane", idx)
				})
			}

			unitsLayer.appendChild(clone)

			// Damage overlay: red X drawn on top of the image
			if (plane.damaged) {
				const sz = Math.min(imgW, imgH) * 0.55
				const x1 = center.x - sz / 2, y1 = center.y - sz / 2
				const x2 = center.x + sz / 2, y2 = center.y + sz / 2
				for (const [ax, ay, bx, by] of [[x1,y1,x2,y2],[x2,y1,x1,y2]]) {
					const line = document.createElementNS(svgNS, 'line')
					line.setAttribute('x1', String(ax)); line.setAttribute('y1', String(ay))
					line.setAttribute('x2', String(bx)); line.setAttribute('y2', String(by))
					line.setAttribute('stroke', '#cc0000')
					line.setAttribute('stroke-width', '2.5')
					line.setAttribute('stroke-linecap', 'round')
					line.style.pointerEvents = 'none'
					unitsLayer.appendChild(line)
				}
			}

			// Gun-jam badge
			if (plane.jammed) {
				const badge = document.createElementNS(svgNS, 'rect')
				badge.setAttribute('x', String(center.x - 9))
				badge.setAttribute('y', String(center.y - imgH / 2 - 1))
				badge.setAttribute('width', '18')
				badge.setAttribute('height', '9')
				badge.setAttribute('rx', '2')
				badge.setAttribute('fill', '#cc6600')
				badge.style.pointerEvents = 'none'
				unitsLayer.appendChild(badge)
				const label = document.createElementNS(svgNS, 'text')
				label.setAttribute('x', String(center.x))
				label.setAttribute('y', String(center.y - imgH / 2 + 7))
				label.setAttribute('text-anchor', 'middle')
				label.setAttribute('font-size', '6')
				label.setAttribute('font-family', 'sans-serif')
				label.setAttribute('fill', '#fff')
				label.style.pointerEvents = 'none'
				label.textContent = 'JAM'
				unitsLayer.appendChild(label)
			}
		})
	})
}

export {}
