"use strict"

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

// on_update is called every time the view changes (after each action, on connect, etc.)
// The global `view` holds the latest view object from rules.js on_view().
// The global `player` holds the current role name ("X", "O", or "Observer").
function on_update() {
	console.log({view, player, planePlaceholder})
	const unitsLayer = document.getElementById("units")
	view.board.planes.forEach(plane => {
		// TODO:
		// const svgPlane = planePlaceholder.clone() // SVGImageElement;
		// 1. set href of svgPlane to plane.img + ".jpg"
		// 2. center the plane in hex plane.at. lookup the hex in svg with document.getElementById(plane.at)
	})
}