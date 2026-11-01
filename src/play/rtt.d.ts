import type {Player} from "../shared/shared";
import type {View} from "../shared/view";

declare global {
  interface GameView extends View {}

  interface GameTypes {
    player: Player
  }

  function add_main_menu_item_link(text: string, url: string): void;
}
