"use strict"

// on_init is called once when the client connects.
// Use it to set up DOM event listeners and any one-time initialization.
// Parameters: scenario (string), options (object), static_view (from on_static_view in rules)
function on_init(scenario, options, static_view) {
	console.log({scenario, options, static_view})
}

// on_update is called every time the view changes (after each action, on connect, etc.)
// The global `view` holds the latest view object from rules.js on_view().
// The global `player` holds the current role name ("X", "O", or "Observer").
function on_update() {
	console.log({view, player})
}