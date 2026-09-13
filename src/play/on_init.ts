import {send_action, toggle_zoom, view} from "./rtt";
import {hexOverlay} from "./refs/hexOverlay";
import {planePlaceholder} from "./refs/planePlaceholder";

export function onInit(scenario: string, options: unknown, static_view: unknown) {
  planePlaceholder.remove()
  toggle_zoom()

  // Click on a hex → send move_hex if it's a valid target
  document.querySelectorAll('#hexes use').forEach(el => {
    el.addEventListener('click', () => {
      if (view.actions?.move_hex?.includes(el.id))
        send_action("move_hex", el.id)
    })
  })

  const svg = document.querySelector('#mapwrap svg')!
  hexOverlay.id = 'hex-overlay'
  svg.insertBefore(hexOverlay, document.getElementById('units'))

  const hexTemplate = document.getElementById('hexTemplate')!;
  hexTemplate.classList.add('hex');
  hexTemplate.removeAttribute('fill-opacity');
  console.log(hexTemplate)
}