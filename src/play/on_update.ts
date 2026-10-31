import {clearHexHighlights, highlightHexes} from "./highlightHexes";
import {drawPlanes} from "./drawPlanes";
import {drawBombed} from "./drawBombed";
import {drawTargets} from "./drawTargets";
import {drawAaGuns} from "./drawAaGuns";
import {drawSun} from "./drawSun";

export function onUpdate() {
  // action_button prepends, so the last one ends up first
  action_button("bardzo_nisko", "Bardzo nisko")
  action_button("nisko", "Nisko")
  action_button("wysoko", "Wysoko")
  action_button("deselect", "Odznacz samolot")
  action_button("unjam", "Odblokuj karabiny")
  action_button("attack", "Atakuj")
  action_button("done", "Done")
  action_button("undo", "Undo")

  document.querySelectorAll('#hexes .action').forEach(el => el.classList.remove('action'))

  view.actions?.move_hex
    ?.map(id => document.getElementById(id))
    ?.forEach(el => el?.classList.remove('action'))

  clearHexHighlights();
  highlightHexes(view.actions?.move_hex, '#8080ff');
  highlightHexes(view.fire_line, '#ff4444');
  highlightHexes(view.actions?.bomb, '#ff9900');
  highlightHexes(view.actions?.place_gun, '#ffff66');

  drawSun()
  drawTargets()
  drawBombed()
  drawPlanes()
  drawAaGuns()
}
