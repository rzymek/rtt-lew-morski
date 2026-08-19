"use strict"

// on_init is called once when the client connects.
// Use it to set up DOM event listeners and any one-time initialization.
// Parameters: scenario (string), options (object), static_view (from on_static_view in rules)
function on_init(scenario, options, static_view) {
	for (let i = 0; i < 9; i++) {
		document.getElementById("cell" + i).addEventListener("click", () => {
			// send_action returns true if the action was legal and sent.
			// It checks view.actions["place"] contains i before sending.
			send_action("place", i)
		})
	}
}

// on_update is called every time the view changes (after each action, on connect, etc.)
// The global `view` holds the latest view object from rules.js on_view().
// The global `player` holds the current role name ("X", "O", or "Observer").
function on_update() {
	for (let i = 0; i < 9; i++) {
		let cell = document.getElementById("cell" + i)
		let val = view.board[i]

		// Show the mark (or blank for empty)
		cell.textContent = val === 1 ? "X" : val === 2 ? "O" : ""

		// Highlight cells the active player can click
		let can_place = !!(view.actions?.place?.includes(i))
		cell.classList.toggle("x-mark", val === 1)
		cell.classList.toggle("o-mark", val === 2)
		cell.classList.toggle("can-place", can_place)
	}

	// action_button shows a button in the toolbar if the named action is legal.
	action_button("undo", "Undo")
}