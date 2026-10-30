import type {View} from "./view";

declare global {
  interface GameView extends View {}

  function toggle_zoom(): void;
}
