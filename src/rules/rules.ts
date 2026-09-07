import data from "./data.js"
import type { PlaneData } from "./data.js"

/* --- TYPES --- */

export interface PlaneInstance {
	plane: PlaneData
	at: string
	direction: number
	damaged?: boolean
	destroyed?: boolean
	jammed?: boolean
}

interface Board {
	planes: Record<number, (PlaneInstance | null)[]>
}

interface FrameState {
	P: string
	I: number
	L: FrameState | null
	$?: unknown
	message?: string
	[key: string]: unknown
}

interface GameState {
	active: number | string | string[] | null
	seed: number
	log: string[]
	undo: any[]
	L: FrameState | null
	board: Board
	targets?: string[]
	moved?: number[]
	selected_plane?: number
	shot?: number[]
	result?: string
}

interface ViewState {
	log: string[]
	prompt: string | null
	actions: Record<string, number | (string | number)[]>
	board?: Board
	active_side?: number
	unmoved?: number[]
	moves?: Record<string, number>
	selected_at?: string
	fire_line?: string[]
	shot?: number[]
}

interface StateDefinition {
	inactive?: string
	_begin?: () => void
	_end?: () => void
	_resume?: () => void
	prompt?: () => void
	[action: string]: unknown
}

/* --- GAME DATA --- */

export let G!: GameState
export let L!: FrameState | null
export let R!: number
export let V!: ViewState | null
export const P: Record<string, StateDefinition | string | Array<() => void>> = {}

export const ROLES = ["Niemcy", "Brytyjczycy"]
const planes = data.planes
const R_Niem = 0
const R_Bryt = 1

/* --- HEX HELPERS --- */

// Clockwise from North: N, NE, SE, S, SW, NW
const DIR_OFFSETS: [number, number][] = [
	[0, +1], [+1, +1], [+1, 0],
	[0, -1], [-1, -1], [-1, 0],
]

function parseHex(id: string): [number, number] | [null, null] {
	const m = id && id.match(/^A(\d+)\.B(\d+)$/)
	return m ? [parseInt(m[1]), parseInt(m[2])] : [null, null]
}

function hexId(a: number, b: number): string {
	return `A${String(a).padStart(2,'0')}.B${String(b).padStart(2,'0')}`
}

function hexStep(id: string, dir: number): string | null {
	const [a, b] = parseHex(id)
	if (a === null) return null
	const [da, db] = DIR_OFFSETS[dir]
	const na = a + da, nb = b + db
	if (na < 0 || nb < 0) return null
	return hexId(na, nb)
}

// Returns {hexId: finalDirection} for all valid destinations.
// Prefers straight path over turning for tie-breaking on direction.
function movesMapFor(plane: PlaneInstance): Record<string, number> {
	const maxMp = plane.plane.predkosc_max
	const minMp = plane.plane.predkosc_min
	const turnDist = plane.plane.zwrotnosc
	const dir = plane.direction
	const moves: Record<string, number> = {}

	// Precompute straight path (index = steps taken from start)
	const straight: (string | null)[] = [plane.at]
	for (let s = 1; s <= maxMp; s++)
		straight.push(hexStep(straight[s - 1]!, dir))

	// No turn: final direction unchanged
	for (let d = minMp; d <= maxMp; d++)
		if (straight[d]) moves[straight[d]!] = dir

	// One turn of ±60° after at least turnDist straight steps,
	// followed by at least 1 hex in the new direction
	for (const dTurn of [-1, +1]) {
		const newDir = ((dir + dTurn) + 6) % 6
		for (let s = turnDist; s < maxMp; s++) {
			if (!straight[s]) break
			let pos: string | null = straight[s]
			for (let r = 1; s + r <= maxMp; r++) {
				pos = hexStep(pos!, newDir)
				if (!pos) break
				if (s + r >= minMp && !(pos in moves))
					moves[pos] = newDir
			}
		}
	}

	return moves
}

function possibleMovesFor(plane: PlaneInstance): string[] {
	const result: string[] = []
	for (const h of Object.keys(movesMapFor(plane)))
		set_add(result, h)
	return result
}

/* --- COMBAT HELPERS --- */

// [atk][dist-1] = [min, max] roll to hit (2d6); null = no hit possible
// Roll 2 or 12 always causes gun jam regardless of this table.
const COMBAT_TABLE: ([number, number] | null)[][] = [
	[null,       null,       null,       null,       null],       // atk 0
	[[10, 11],   [11, 11],   null,       null,       null],       // atk 1
	[[9,  11],   [10, 11],   [11, 11],   null,       null],       // atk 2
	[[8,  11],   [9,  11],   [10, 11],   [11, 11],   null],       // atk 3
	[[7,  11],   [8,  11],   [9,  11],   [10, 11],   [11, 11]],   // atk 4
	[[6,  11],   [7,  11],   [8,  11],   [9,  11],   [10, 11]],   // atk 5
]

function fireLineHexes(plane: PlaneInstance): string[] {
	const hexes: string[] = []
	let pos: string | null = plane.at
	for (let i = 0; i < 5; i++) {
		pos = hexStep(pos, plane.direction)
		if (!pos) break
		hexes.push(pos)
	}
	return hexes
}

interface FireTarget {
	side: number
	idx: number
	plane: PlaneInstance
	distance: number
}

// Returns {side, idx, plane, distance} of first (closest) plane on fire line, or null.
// Any plane (friendly or enemy) blocks further fire.
function firstOnFireLine(attackerPlane: PlaneInstance, allPlanes: Board['planes']): FireTarget | null {
	const byHex: Record<string, { side: number, idx: number, plane: PlaneInstance }> = {}
	for (const [sideStr, sidePlanes] of Object.entries(allPlanes)) {
		const side = parseInt(sideStr)
		sidePlanes.forEach((p, idx) => {
			if (p && !p.destroyed) byHex[p.at] = {side, idx, plane: p}
		})
	}
	const line = fireLineHexes(attackerPlane)
	for (let d = 0; d < line.length; d++) {
		if (line[d] in byHex)
			return {...byHex[line[d]], distance: d + 1}
	}
	return null
}

interface ShotResult {
	roll: number
	atk: number
	result: string
}

function resolveShot(attackerPlane: PlaneInstance, targetPlane: PlaneInstance, distance: number): ShotResult {
	const atk = Math.max(0, attackerPlane.plane.sila_ataku)
	const roll = (random(6) + 1) + (random(6) + 1)

	if (roll === 2 || roll === 12) {
		attackerPlane.jammed = true
		return {roll, atk, result: 'zacięcie karabinów'}
	}

	const tableRow = Math.min(atk, COMBAT_TABLE.length - 1)
	const range = COMBAT_TABLE[tableRow][distance - 1]
	if (range && roll >= range[0] && roll <= range[1]) {
		if (targetPlane.damaged) {
			targetPlane.destroyed = true
			return {roll, atk, result: 'zestrzelony'}
		} else {
			targetPlane.damaged = true
			return {roll, atk, result: 'uszkodzony'}
		}
	}
	return {roll, atk, result: 'pudło'}
}

/* --- SETUP --- */


/** Called by the framework when creating a new game.
 * G.seed, G.log, G.undo are already initialized.
 * You must set G.active to the starting player, then call the first state.
 */
function on_setup(_scenario: string, _options: unknown) {
	G.board = {
		planes:
			{
				[R_Bryt]: [
					{plane: planes.SpitL, at: 'A10.B08', direction: 0},
					{plane: planes.Spit, at: 'A11.B08', direction: 1},
					{plane: planes.Spit, at: 'A09.B08', direction: 2},
				],
				[R_Niem]: [
					{plane: planes.ME110, at: 'A40.B35', direction: 4},
					{plane: planes.ME110, at: 'A40.B36', direction: 4},

					{plane: planes.HE111, at: 'A41.B35', direction: 4},
					{plane: planes.HE111, at: 'A42.B35', direction: 4},
					{plane: planes.HE111, at: 'A39.B35', direction: 4},
					{plane: planes.HE111, at: 'A38.B35', direction: 4},
				]
			}
	}
	G.targets = [
		'A06.B19', 'A16.B24',
	]
	G.moved = []
	G.active = R_Niem
	call("move_planes")
}

/* --- VIEW --- */

// Called by the framework to build the view object for each player.
// V.log, V.prompt, V.actions are managed by the framework.
// Put everything the client needs to render the board here.
// IMPORTANT: never mutate G here!
function on_view() {
	V!.board = G.board
	V!.active_side = G.active as number
	if (R === G.active) {
		if (L!.P === 'move_planes') {
			const moved = G.moved ?? []
			V!.unmoved = G.board.planes[G.active as number]
				.map((_, idx) => idx)
				.filter(idx => !set_has(moved, idx))
		}
		if (L!.P === 'combat_initiative' || L!.P === 'combat_reaction') {
			V!.shot = G.shot ?? []
		}
		if (G.selected_plane !== undefined) {
			const plane = G.board.planes[G.active as number][G.selected_plane]
			if (plane) {
				V!.selected_at = plane.at
				if (L!.P === 'move_planes') {
					V!.moves = movesMapFor(plane)
				} else {
					V!.fire_line = fireLineHexes(plane)
				}
			}
		}
	}
}

/* --- STATES --- */

// The "take_turn" state is where both players spend all their time.
// The framework calls prompt() to get valid actions, then calls place(i)
// when the active player clicks a cell.

P.move_planes = {
	inactive: "faza ruchu samolotów",

	prompt() {
		prompt("faza ruchu samolotów")
		button("done", (V!.unmoved as number[]).length === 0)
		if (G.selected_plane !== undefined) {
			const plane = G.board.planes[G.active as number][G.selected_plane]
			for (const hex of possibleMovesFor(plane!)) {
				action("move_hex", hex)
			}
			action("select_plane", G.selected_plane)
		} else {
			const moved = G.moved ?? []
			G.board.planes[G.active as number].forEach((_, idx) => {
				if (!set_has(moved, idx))
					action("select_plane", idx)
			})
		}
	},

	done() {
		G.moved = []
		delete G.selected_plane
		goto("combat_initiative")
	},

	select_plane(planeIdx: number) {
		if (G.selected_plane === planeIdx) {
			delete G.selected_plane
		} else {
			G.selected_plane = planeIdx
		}
	},

	move_hex(target: string) {
		if (G.selected_plane === undefined) return
		const plane = G.board.planes[G.active as number][G.selected_plane]
		const moves = movesMapFor(plane!)
		if (!(target in moves)) return
		push_undo()
		plane!.at = target
		plane!.direction = moves[target]
		if (!G.moved) G.moved = []
		set_add(G.moved, G.selected_plane)
		delete G.selected_plane
	},
}

/* --- COMBAT STATES --- */

// Turn order:
//   move_planes(Niem) → combat_initiative(Niem) → combat_reaction(Bryt)
//   → move_planes(Bryt) → combat_initiative(Bryt) → combat_reaction(Niem) → ...

P.combat_initiative = {
	inactive: "faza walki",

	_begin() {
		G.shot = []
	},

	prompt() {
		const enemySide = G.active === R_Niem ? R_Bryt : R_Niem
		const myPlanes = G.board.planes[G.active as number] ?? []
		const shot = G.shot ?? []

		prompt("Faza walki – inicjatywa: " + ROLES[G.active as number])
		button("done", true)

		myPlanes.forEach((plane, idx) => {
			if (plane && !plane.destroyed)
				action("select_plane", idx)
		})

		if (G.selected_plane !== undefined) {
			const idx = G.selected_plane
			const plane = myPlanes[idx]
			if (plane && !set_has(shot, idx) && !plane.destroyed) {
				if (plane.jammed) {
					button("unjam", true)
				} else {
					const target = firstOnFireLine(plane, G.board.planes)
					if (target && target.side === enemySide)
						button("attack", true)
				}
			}
		}
	},

	select_plane(idx: number) {
		if (G.selected_plane === idx) delete G.selected_plane
		else G.selected_plane = idx
	},

	attack() {
		const idx = G.selected_plane
		if (idx === undefined) return
		const myPlanes = G.board.planes[G.active as number] ?? []
		const plane = myPlanes[idx]
		if (!plane || plane.jammed || plane.destroyed) return
		const enemySide = G.active === R_Niem ? R_Bryt : R_Niem
		const hit = firstOnFireLine(plane, G.board.planes)
		if (!hit || hit.side !== enemySide) return

		push_undo()
		set_add(G.shot!, idx)
		const targetPlane = G.board.planes[hit.side][hit.idx]
		const {roll, atk, result} = resolveShot(plane, targetPlane!, hit.distance)
		log(`${ROLES[G.active as number]} atakuje [SA:${atk} odl:${hit.distance} rzut:${roll}] → ${result}`)
		delete G.selected_plane
	},

	unjam() {
		const idx = G.selected_plane
		if (idx === undefined) return
		const plane = G.board.planes[G.active as number][idx]
		if (!plane || !plane.jammed) return
		push_undo()
		set_add(G.shot!, idx)
		const roll = random(6) + 1
		if (roll === 6) {
			delete plane.jammed
			log(`${ROLES[G.active as number]} odblokował karabiny (rzut:${roll}) – sukces`)
		} else {
			log(`${ROLES[G.active as number]} nie odblokował karabinów (rzut:${roll})`)
		}
		delete G.selected_plane
	},

	done() {
		delete G.selected_plane
		G.active = G.active === R_Niem ? R_Bryt : R_Niem
		goto("combat_reaction")
	},
}

P.combat_reaction = {
	inactive: "faza reakcji",

	_begin() {
		G.shot = []
	},

	prompt() {
		const initiativeSide = G.active === R_Niem ? R_Bryt : R_Niem
		const myPlanes = G.board.planes[G.active as number] ?? []
		const shot = G.shot ?? []

		prompt("Faza walki – reakcja: " + ROLES[G.active as number])
		button("done", true)

		// Only planes that have an initiative-side target on their fire line may react
		myPlanes.forEach((plane, idx) => {
			if (!plane || plane.destroyed || plane.jammed) return
			if (set_has(shot, idx)) return
			const target = firstOnFireLine(plane, G.board.planes)
			if (target && target.side === initiativeSide)
				action("select_plane", idx)
		})
		// Also allow deselect of current selection
		if (G.selected_plane !== undefined)
			action("select_plane", G.selected_plane)

		if (G.selected_plane !== undefined) {
			const idx = G.selected_plane
			const plane = myPlanes[idx]
			if (plane && !set_has(shot, idx) && !plane.destroyed && !plane.jammed) {
				const target = firstOnFireLine(plane, G.board.planes)
				if (target && target.side === initiativeSide)
					button("attack", true)
			}
		}
	},

	select_plane(idx: number) {
		if (G.selected_plane === idx) delete G.selected_plane
		else G.selected_plane = idx
	},

	attack() {
		const idx = G.selected_plane
		if (idx === undefined) return
		const myPlanes = G.board.planes[G.active as number] ?? []
		const plane = myPlanes[idx]
		if (!plane || plane.jammed || plane.destroyed) return
		const initiativeSide = G.active === R_Niem ? R_Bryt : R_Niem
		const hit = firstOnFireLine(plane, G.board.planes)
		if (!hit || hit.side !== initiativeSide) return

		push_undo()
		set_add(G.shot!, idx)
		const targetPlane = G.board.planes[hit.side][hit.idx]
		const {roll, atk, result} = resolveShot(plane, targetPlane!, hit.distance)
		log(`${ROLES[G.active as number]} reaguje [SA:${atk} odl:${hit.distance} rzut:${roll}] → ${result}`)
		delete G.selected_plane
	},

	done() {
		delete G.selected_plane
		goto("move_planes")
	},
}

/* FRAMEWORK */

/*
"use strict"
const ROLES = []
const SCENARIOS = []
var G, L, R, V, P = {}
function on_setup(scenario, options) {}
function on_static_view() {}
function on_view() {}
function on_query(q) {}
function on_assert() {}
*/

function log(s?: string) {
	if (s === undefined) {
		if (G.log.length > 0 && G.log[G.log.length - 1] !== "")
			G.log.push("")
	} else {
		G.log.push(s)
	}
}

function prompt(s: string) {
	V!.prompt = s
}

function button(act: string, enabled: boolean | number = true) {
	V!.actions[act] = !!enabled ? 1 : 0
}

export function action(act: string, argument: string | number) {
	if (!(act in V!.actions))
		V!.actions[act] = []
	set_add(V!.actions[act] as (string | number)[], argument)
}

export function finish(result: number | string, message: string) {
	G.active = -1
	G.result = ROLES[result as number] ?? result as string
	G.L = L = {P: '', I: 0, L: null, message} as FrameState
	log()
	log(message)
}

function call_or_goto(pred: boolean, name: string, env?: object) {
	if (pred)
		call(name, env)
	else
		goto(name, env)
}

function call(name: string, env?: object) {
	G.L = L = {...env, P: name, I: 0, L: L} as FrameState
	;(P[name] as StateDefinition)?._begin?.()
}

function goto(name: string, env?: object) {
	;(P[L!.P] as StateDefinition)?._end?.()
	G.L = L = {...env, P: name, I: 0, L: L!.L} as FrameState
	;(P[name] as StateDefinition)?._begin?.()
}

function end(result?: unknown) {
	;(P[L!.P] as StateDefinition)?._end?.()
	G.L = L = L!.L
	if (result !== undefined)
		L!.$ = result
	;(P[L!.P] as StateDefinition)?._resume?.()
}

function resume() {
	;(P[L!.P] as StateDefinition)?._resume?.()
}


export const roles = ROLES;

export const scenarios = ["Standard"];

export function setup(seed: number, scenario: string, options: unknown): GameState {
	G = {
		active: null,
		seed,
		log: [],
		undo: [],
		L: null,
		board: { planes: {} },
	}
	L = null
	R = -1
	V = null

	on_setup(scenario, options)
	_run()
	_save()

	return G
}

export function static_view(_game: GameState) {
	let SV = null
	// @ts-ignore - on_static_view is an optional game hook
	if (typeof on_static_view === "function") {
		// @ts-ignore
		G = state
		L = null
		// @ts-ignore
		R = role
		V = null
		_load()
		// @ts-ignore
		SV = on_static_view()
		_save()
	}
	return SV
}

export function view(state: GameState, role: string): ViewState {
	G = state
	L = G.L
	R = role as any
	V = {
		log: G.log,
		prompt: null,
		actions: {},
	}

	if ((Array.isArray(G.active) && G.active.includes(R as any)) || G.active === (R as any)) {
		_load()
		on_view()

		V.actions = {}

		try {
			if (P[L!.P])
				(P[L!.P] as StateDefinition).prompt!()
			else
				V.prompt = "TODO: " + L!.P
		} catch (x) {
			console.error(x)
			V.prompt = String(x)
		}

		if (V.actions.undo === undefined)
			button("undo", (G.undo?.length ?? 0) > 0)

		_save()
	} else {
		_load()
		on_view()
		_save()

		if (G.active === "None") {
			V.prompt = L!.message ?? null
		} else {
			const inactive = (P[L!.P] as StateDefinition)?.inactive
			if (inactive) {
				if (Array.isArray(G.active))
					V.prompt = `Waiting for ${(G.active as string[]).join(" and ")} to ${inactive}.`
				else
					V.prompt = `Waiting for ${G.active} to ${inactive}.`
			} else {
				if (Array.isArray(G.active))
					V.prompt = `Waiting for ${(G.active as string[]).join(" and ")}.`
				else
					V.prompt = `Waiting for ${G.active}.`
			}
		}
	}

	return V
}

function _action(state: GameState, role: string, act: string, argument: unknown): GameState {
	G = state
	L = G.L
	R = role as any
	V = null

	const old_active = G.active

	_load()

	const this_state = P[L!.P] as StateDefinition
	if (this_state && typeof this_state[act] === "function") {
		(this_state[act] as (arg: unknown) => void)(argument)
		_run()
	} else if (act === "undo" && G.undo.length > 0) {
		pop_undo()
	} else {
		throw new Error("Invalid action: " + act)
	}

	_save()

	if (old_active !== G.active)
		clear_undo()

	return G
}

function _finish(state: GameState, result: number | string, message: string): GameState {
	G = state
	L = G.L
	R = -1
	V = null

	_load()
	finish(result, message)
	_save()

	return G
}

export function query(state: GameState, role: string, q: unknown): unknown {
	G = state
	L = G.L
	R = role as any
	V = null

	_load()
	// @ts-ignore - on_query is an optional game hook
	const result = typeof on_query === "function" ? on_query(q) : undefined
	_save()

	return result
}

export function assert(state: GameState): void {
	// @ts-ignore - on_assert is an optional game hook
	if (typeof on_assert === "function") {
		G = state
		L = G.L
		R = -1
		V = null
		_load()
		// @ts-ignore
		on_assert()
		_save()
	}
}


function _load() {
	R = ROLES.indexOf(R as any)
	if (Array.isArray(G.active))
		G.active = (G.active as string[]).map(r => ROLES.indexOf(r)) as any
	else
		G.active = ROLES.indexOf(G.active as string)
}

function _save() {
	if (Array.isArray(G.active))
		G.active = (G.active as number[]).map(r => ROLES[r]) as any
	else
		G.active = ROLES[G.active as number] ?? "None"
}

function _run() {
	for (let i = 0; i < 1000 && L; ++i) {
		const prog = P[L.P]
		if (typeof prog === "function") {
			(prog as unknown as () => void)()
		} else if (Array.isArray(prog)) {
			if (L.I < prog.length) {
				try {
					prog[L.I++]()
				} catch (err: any) {
					err.message += "\n\tat P." + L.P + ":" + L.I
					throw err
				}
			} else {
				end()
			}
		} else {
			return // state
		}
	}
	if (L)
		throw new Error("runaway script")
}

function _parse(text: string): string[] {
	const prog: string[] = []

	function lex(s: string) {
		let words: string[] = []
		let p = 0
		const n = s.length
		let m: number

		function lex_flush() {
			if (words.length > 0) {
				command(words)
				words = []
			}
		}

		function lex_newline() {
			while (p < n && s[p] === "\n")
				++p
			lex_flush()
		}

		function lex_semi() {
			++p
			lex_flush()
		}

		function lex_comment() {
			while (p < n && s[p] !== "\n")
				++p
		}

		function lex_word() {
			while (p < n && !" \t\n".includes(s[p]))
				++p
			words.push(s.substring(m, p))
		}

		function lex_qstring(q: string) {
			let x = 1
			++p
			while (p < n && x > 0) {
				if (s[p] === q)
					--x
				++p
			}
			if (p >= n && x > 0)
				throw new Error("unterminated string")
			words.push(s.substring(m, p))
		}

		function lex_bstring(a: string, b: string) {
			let x = 1
			++p
			while (p < n && x > 0) {
				if (s[p] === a)
					++x
				else if (s[p] === b)
					--x
				++p
			}
			if (p >= n && x > 0)
				throw new Error("unterminated string")
			words.push(s.substring(m, p))
		}

		while (p < n) {
			while (s[p] === " " || s[p] === "\t")
				++p
			if (p >= n) break
			m = p
			if (s[p] === "{") lex_bstring("{", "}")
			else if (s[p] === "[") lex_bstring("[", "]")
			else if (s[p] === "(") lex_bstring("(", ")")
			else if (s[p] === '"') lex_qstring('"')
			else if (s[p] === "\n") lex_newline()
			else if (s[p] === ";") lex_semi()
			else if (s[p] === "#") lex_comment()
			else if (s[p] === "/" && s[p + 1] === "/") lex_comment()
			else if (s[p] === "-" && s[p + 1] === "-") lex_comment()
			else lex_word()
		}

		if (words.length > 0)
			command(words)
	}

	function command(line: string[]) {
		let ix_loop: number, ix1: number, ix2: number
		let i: string, k: string, start: string, end_: string, array: string, body: string

		switch (line[0]) {
		case "set":
			if (line.length !== 3)
				throw new Error("invalid set - " + line.join(" "))
			emit(line[1] + " = " + line[2])
			break

		case "incr":
			if (line.length !== 2)
				throw new Error("invalid incr - " + line.join(" "))
			emit("++(" + line[1] + ")")
			break

		case "decr":
			if (line.length !== 2)
				throw new Error("invalid decr - " + line.join(" "))
			emit("--(" + line[1] + ")")
			break

		case "eval":
			emit(line.slice(1).join(" "))
			break

		case "log":
			emit("log(" + line.slice(1).join(" ") + ")")
			break

		case "call":
			if (line.length === 3)
				emit("call(" + quote(line[1]) + ", " + line[2] + ")")
			else if (line.length === 2)
				emit("call(" + quote(line[1]) + ")")
			else
				throw new Error("invalid call - " + line.join(" "))
			break

		case "goto":
			if (line.length === 3)
				emit("goto(" + quote(line[1]) + ", " + line[2] + ")")
			else if (line.length === 2)
				emit("goto(" + quote(line[1]) + ")")
			else
				throw new Error("invalid goto - " + line.join(" "))
			break

		case "return":
			if (line.length === 1)
				emit(`end()`)
			else if (line.length === 2)
				emit(`end(${line[1]})`)
			else
				throw new Error("invalid return - " + line.join(" "))
			break

		case "while":
			// while (exp) { block }
			if (line.length !== 3)
				throw new Error("invalid while - " + line.join(" "))
			ix_loop = emit_jz(line[1])
			block(line[2])
			emit_jump(ix_loop)
			label(ix_loop)
			break

		case "for":
			// for i in (start) to (end) { block }
			if (line.length === 7 && line[2] === "in" && line[4] === "to") {
				i = line[1]
				start = line[3]
				end_ = line[5]
				body = line[6]
				emit(`${i} = ${start}`)
				ix_loop = prog.length
				block(body)
				emit(`if ((${i}) < ${end_}) { ++(${i}); L.I = ${ix_loop} }`)
				return
			}
				// for i in (array) { block }
			// NOTE: array is evaluated repeatedly so should be a constant!
			else if (line.length === 5 && line[2] === "in") {
				k = line[1]
				i = k.replace(/^G\./, "L.G_") + "_"
				array = line[3]
				body = line[4]
				emit(`${i} = 0`)
				ix_loop = emit(`if (${i} < ${array}.length) { ${k} = ${array}[${i}++] } else { delete ${i} ; L.I = @ }`)
				block(body)
				emit_jump(ix_loop)
				label(ix_loop)
			} else {
				throw new Error("invalid for - " + line.join(" "))
			}
			break

		case "if":
			// if (exp) { block}
			// if (exp) { block } else { block }
			// TODO: if (exp) { block } elseif (exp) { block } else { block }
			if (line.length === 3) {
				ix1 = emit_jz(line[1])
				block(line[2])
				label(ix1)
			} else if (line.length === 5 && line[3] === "else") {
				ix1 = emit_jz(line[1])
				block(line[2])
				ix2 = emit_jump()
				label(ix1)
				block(line[4])
				label(ix2)
			} else {
				throw new Error("invalid if - " + line.join(" "))
			}
			break

		default:
			throw new Error("unknown command - " + line.join(" "))
		}
	}

	function quote(s: string): string {
		if ("{[(`'\"".includes(s[0]))
			return s
		return '"' + s + '"'
	}

	function emit_jz(exp: string, to = "@"): number {
		return emit("if (!(" + exp + ")) L.I = " + to)
	}

	function emit_jump(to = "@"): number {
		return emit("L.I = " + to)
	}

	function emit(s: string): number {
		prog.push(s)
		return prog.length - 1
	}

	function label(ix: number) {
		prog[ix] = prog[ix].replace("@", String(prog.length))
	}

	function block(body: string) {
		if (body[0] !== "{")
			throw new Error("expected block")
		lex(body.slice(1, -1))
	}

	lex(text)

	return prog
}

function script(text: string): string {
	return text
}

;(function _compile() {
	const cache: Record<string, () => void> = {}
	for (const name in P) {
		if (typeof P[name] === "string") {
			const prog: Array<() => void> = []
			try {
				for (const inst of _parse(P[name] as string)) {
					try {
						prog.push(cache[inst] ??= eval("(function(){" + inst + "})"))
					} catch (err: any) {
						err.message += "\n\tat (" + inst + ")"
						throw err
					}
				}
			} catch (err: any) {
				err.message += "\n\tat P." + name
				throw err
			}
			P[name] = prog
		}
	}
})()

/* LIBRARY */

function clear_undo() {
	if (G.undo) {
		G.undo.length = 0
	}
}

function push_undo() {
	if (G.undo) {
		const copy: any = {}
		for (const k in G) {
			let v: any = (G as any)[k]
			if (k === "undo")
				continue
			else if (k === "log")
				v = v.length
			else if (typeof v === "object" && v !== null)
				v = object_copy(v)
			copy[k] = v
		}
		G.undo.push(copy)
	}
}

function pop_undo() {
	if (G.undo) {
		const save_log = G.log
		const save_undo = G.undo
		G = save_undo.pop()
		save_log.length = G.log as unknown as number
		G.log = save_log
		G.undo = save_undo
	}
}

function random(range: number): number {
	// An MLCG using integer arithmetic with doubles.
	// https://www.ams.org/journals/mcom/1999-68-225/S0025-5718-99-00996-5/S0025-5718-99-00996-5.pdf
	// m = 2**35 − 31
	return (G.seed = G.seed * 200105 % 34359738337) % range
}

function random_bigint(range: number): number {
	// Largest MLCG that will fit its state in a double.
	// Uses BigInt for arithmetic, so is an order of magnitude slower.
	// https://www.ams.org/journals/mcom/1999-68-225/S0025-5718-99-00996-5/S0025-5718-99-00996-5.pdf
	// m = 2**53 - 111
	return (G.seed = Number(BigInt(G.seed) * 5667072534355537n % 9007199254740881n)) % range
}

function shuffle(list: unknown[]) {
	// Fisher-Yates shuffle
	let i, j, tmp
	for (i = list.length - 1; i > 0; --i) {
		j = random(i + 1)
		tmp = list[j]
		list[j] = list[i]
		list[i] = tmp
	}
}

function shuffle_bigint(list: unknown[]) {
	// Fisher-Yates shuffle
	let i, j, tmp
	for (i = list.length - 1; i > 0; --i) {
		j = random_bigint(i + 1)
		tmp = list[j]
		list[j] = list[i]
		list[i] = tmp
	}
}

// Fast deep copy for objects without cycles
function object_copy<T>(original: T): T {
	let copy: any, i, n: number, v: any
	if (Array.isArray(original)) {
		n = original.length
		copy = new Array(n)
		for (i = 0; i < n; ++i) {
			v = original[i]
			if (typeof v === "object" && v !== null)
				copy[i] = object_copy(v)
			else
				copy[i] = v
		}
		return copy
	} else {
		copy = {}
		for (i in original) {
			v = (original as any)[i]
			if (typeof v === "object" && v !== null)
				copy[i] = object_copy(v)
			else
				copy[i] = v
		}
		return copy
	}
}

// Fast deep object comparison for objects without cycles
function object_diff(a: unknown, b: unknown): boolean {
	let i: string | number
	let a_length: number
	if (a === b)
		return false
	if (a !== null && b !== null && typeof a === "object" && typeof b === "object") {
		if (Array.isArray(a)) {
			if (!Array.isArray(b))
				return true
			a_length = a.length
			if ((b as unknown[]).length !== a_length)
				return true
			for (i = 0; i < a_length; ++i)
				if (object_diff(a[i], (b as unknown[])[i]))
					return true
			return false
		}
		for (i in a as object)
			if (object_diff((a as any)[i], (b as any)[i]))
				return true
		for (i in b as object)
			if (!(i in (a as object)))
				return true
		return false
	}
	return true
}

// Array remove and insert (faster than splice)

function array_delete(array: unknown[], index: number) {
	let i
	const n = array.length
	for (i = index + 1; i < n; ++i)
		array[i - 1] = array[i]
	array.length = n - 1
}

function array_delete_item(array: unknown[], item: unknown) {
	let i
	const n = array.length
	for (i = 0; i < n; ++i)
		if (array[i] === item)
			return array_delete(array, i)
}

function array_insert(array: unknown[], index: number, item: unknown) {
	for (let i = array.length; i > index; --i)
		array[i] = array[i - 1]
	array[index] = item
}

function array_delete_pair(array: unknown[], index: number) {
	let i
	const n = array.length
	for (i = index + 2; i < n; ++i)
		array[i - 2] = array[i]
	array.length = n - 2
}

function array_insert_pair(array: unknown[], index: number, key: unknown, value: unknown) {
	for (let i = array.length; i > index; i -= 2) {
		array[i] = array[i - 2]
		array[i + 1] = array[i - 1]
	}
	array[index] = key
	array[index + 1] = value
}

// Set as plain sorted array

function set_clear(set: unknown[]) {
	set.length = 0
}

function set_has(set: (string | number)[], item: string | number): boolean {
	let a = 0
	let b = set.length - 1
	while (a <= b) {
		const m = (a + b) >> 1
		const x = set[m]
		if (item < x)
			b = m - 1
		else if (item > x)
			a = m + 1
		else
			return true
	}
	return false
}

function set_add(set: (string | number)[], item: string | number) {
	let a = 0
	let b = set.length - 1
	// optimize fast case of appending items in order
	if (item > set[b]) {
		set[b + 1] = item
		return
	}
	while (a <= b) {
		const m = (a + b) >> 1
		const x = set[m]
		if (item < x)
			b = m - 1
		else if (item > x)
			a = m + 1
		else
			return
	}
	array_insert(set, a, item)
}

function set_delete(set: (string | number)[], item: string | number) {
	let a = 0
	let b = set.length - 1
	while (a <= b) {
		const m = (a + b) >> 1
		const x = set[m]
		if (item < x)
			b = m - 1
		else if (item > x)
			a = m + 1
		else {
			array_delete(set, m)
			return
		}
	}
}

function set_toggle(set: (string | number)[], item: string | number) {
	let a = 0
	let b = set.length - 1
	while (a <= b) {
		const m = (a + b) >> 1
		const x = set[m]
		if (item < x)
			b = m - 1
		else if (item > x)
			a = m + 1
		else {
			array_delete(set, m)
			return
		}
	}
	array_insert(set, a, item)
}

// Map as plain sorted array of key/value pairs

function map_clear(map: unknown[]) {
	map.length = 0
}

function map_has(map: unknown[], key: unknown): boolean {
	let a = 0
	let b = (map.length >> 1) - 1
	while (a <= b) {
		const m = (a + b) >> 1
		const x = map[m << 1]
		if (key < x)
			b = m - 1
		else if (key > x)
			a = m + 1
		else
			return true
	}
	return false
}

function map_get(map: unknown[], key: unknown, missing?: unknown): unknown {
	let a = 0
	let b = (map.length >> 1) - 1
	while (a <= b) {
		const m = (a + b) >> 1
		const x = map[m << 1]
		if (key < x)
			b = m - 1
		else if (key > x)
			a = m + 1
		else
			return map[(m << 1) + 1]
	}
	return missing
}

function map_set(map: unknown[], key: unknown, value: unknown) {
	let a = 0
	let b = (map.length >> 1) - 1
	while (a <= b) {
		const m = (a + b) >> 1
		const x = map[m << 1]
		if (key < x)
			b = m - 1
		else if (key > x)
			a = m + 1
		else {
			map[(m << 1) + 1] = value
			return
		}
	}
	array_insert_pair(map, a << 1, key, value)
}

function map_delete(map: unknown[], key: unknown) {
	let a = 0
	let b = (map.length >> 1) - 1
	while (a <= b) {
		const m = (a + b) >> 1
		const x = map[m << 1]
		if (key < x)
			b = m - 1
		else if (key > x)
			a = m + 1
		else {
			array_delete_pair(map, m << 1)
			return
		}
	}
}

function map_get_set(map: unknown[], key: unknown): unknown[] {
	let set = map_get(map, key, null) as unknown[] | null
	if (set === null)
		map_set(map, key, (set = []))
	return set
}

function map_for_each(map: unknown[], f: (key: unknown, value: unknown) => void) {
	for (let i = 0; i < map.length; i += 2)
		f(map[i], map[i + 1])
}

// same as Object.groupBy
function object_group_by<T>(items: Iterable<T>, callback: ((item: T) => string) | string): Record<string, T[]> {
	let item: T, key: string
	const groups: Record<string, T[]> = {}
	if (typeof callback === "function") {
		for (item of items) {
			key = callback(item)
			if (key in groups)
				groups[key].push(item)
			else
				groups[key] = [item]
		}
	} else {
		for (item of items) {
			key = (item as any)[callback]
			if (key in groups)
				groups[key].push(item)
			else
				groups[key] = [item]
		}
	}
	return groups
}

// like Object.groupBy but for plain array maps
function map_group_by<T>(items: Iterable<T>, callback: ((item: T) => unknown) | string): unknown[] {
	let item: T, key: unknown, arr: T[] | undefined
	const groups: unknown[] = []
	if (typeof callback === "function") {
		for (item of items) {
			key = callback(item)
			arr = map_get(groups, key) as T[] | undefined
			if (arr)
				arr.push(item)
			else
				map_set(groups, key, [item])
		}
	} else {
		for (item of items) {
			key = (item as any)[callback]
			arr = map_get(groups, key) as T[] | undefined
			if (arr)
				arr.push(item)
			else
				map_set(groups, key, [item])
		}
	}
	return groups
}
