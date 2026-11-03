// Zoom & pan to the next plane that can still act in this phase. Client side only.

// Scale the map is zoomed to, unless the player has zoomed in further already.
const FOCUS_ZOOM = 2

let lastFocused: string | undefined

function actingPlanes(): string[] {
  return view.actions?.next_plane ?? []
}

// The pan & zoom code keeps its state private, so it is driven through its keyboard shortcuts.
function pressCtrl(keyCode: number) {
  const event = new KeyboardEvent('keydown', {ctrlKey: true, cancelable: true})
  Object.defineProperty(event, 'keyCode', {get: () => keyCode})
  window.dispatchEvent(event)
}

function currentScale(): number {
  const inner = Number(document.getElementById('pan_zoom_main')?.dataset.scale ?? 1)
  const fit = Number(document.getElementById('mapwrap')?.dataset.scale ?? 1)
  return inner * fit
}

function zoomIn() {
  if (currentScale() >= FOCUS_ZOOM) return
  pressCtrl(48) // ctrl+0: 100%, map fit off
  // ctrl+=: +10% each
  for (let i = 0; i < 10 && currentScale() < FOCUS_ZOOM - 0.05; i++) pressCtrl(187)
}

function focusNextPlane() {
  const ids = actingPlanes()
  if (ids.length === 0) return
  // Starts after the selected plane, or the one shown last if nothing is selected.
  const from = view.selected_plane !== undefined && ids.includes(view.selected_plane) ? view.selected_plane : lastFocused
  const next = ids[(ids.indexOf(from ?? '') + 1) % ids.length]
  lastFocused = next
  send_action('next_plane', next)
  const plane = Object.values(view.board.planes).flat().find(it => it.id === next)
  const hex = plane && document.getElementById(plane.at)
  if (!hex) return
  zoomIn()
  scroll_into_view(hex)
}

export function nextPlaneButton() {
  let button = document.getElementById('next_plane_button') as HTMLButtonElement | null
  if (!button) {
    button = document.createElement('button')
    button.id = 'next_plane_button'
    button.textContent = 'Następny samolot'
    button.addEventListener('click', focusNextPlane)
    document.getElementById('actions')!.prepend(button)
  }
  button.hidden = actingPlanes().length === 0
}
