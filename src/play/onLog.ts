import {createLogRenderer} from "@rzymek/rally-the-troops-module/client";

/** The rules name planes with ref("p", ...) and hexes with ref("h", ...) (see rules/game/refs.ts). */
const render = createLogRenderer({
  targets: {
    p: id => [...document.querySelectorAll(`#units [data-plane="${CSS.escape(id)}"]`)],
    h: hex => [document.getElementById(hex)].filter(it => it !== null),
  },
})

/** Games started before the stages were headings logged them as plain "Etap N". */
export const onLog = (text: string): HTMLElement => render(/^Etap \d+$/.test(text) ? `.h1 ${text}` : text)
