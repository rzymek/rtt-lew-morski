import {hexOverlay} from "./refs/hexOverlay";
import {bombedLayer} from "./refs/bombedLayer";
import {targetsLayer} from "./refs/targetsLayer";
import {aaGunsLayer} from "./refs/aaGunsLayer";
import {sunLayer} from "./refs/sunLayer";
import {planePlaceholder} from "./refs/planePlaceholder";
import {expandedStackLayer} from "./refs/expandedStackLayer";
import {collapseStack} from "./drawPlanes";
import {HEX_ACTIONS} from "./hexActions";

export function onInit() {
  planePlaceholder.remove()
  toggle_zoom()

  // Click on a hex → send move_hex or bomb if it's a valid target
  document.querySelectorAll('#hexes use').forEach(el => {
    el.addEventListener('click', () => {
      const hexAction = HEX_ACTIONS.find(it => view.actions?.[it]?.includes(el.id))
      if (hexAction) send_action(hexAction, el.id)
    })
  })

  const svg = document.querySelector('#mapwrap svg')!
  sunLayer.id = 'sun'
  svg.insertBefore(sunLayer, document.getElementById('units'))
  targetsLayer.id = 'targets'
  svg.insertBefore(targetsLayer, document.getElementById('units'))
  bombedLayer.id = 'bombed'
  svg.insertBefore(bombedLayer, document.getElementById('units'))
  hexOverlay.id = 'hex-overlay'
  svg.insertBefore(hexOverlay, document.getElementById('units'))
  // Above the planes: a gun under a counter must stay clickable.
  aaGunsLayer.id = 'aa-guns'
  svg.appendChild(aaGunsLayer)
  expandedStackLayer.id = 'expanded-stack'
  svg.appendChild(expandedStackLayer)

  // Counters that act on a click stop it from getting here
  svg.addEventListener('click', collapseStack)

  const hexTemplate = document.getElementById('hexTemplate')!;
  hexTemplate.classList.add('hex');
  hexTemplate.removeAttribute('fill-opacity');
  console.log(hexTemplate)
}