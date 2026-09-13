import type {View} from "./view";

declare global {
  const view: View;
  function send_action(action: string, argument?: unknown): void;
  function action_button(action: string, label: string): void;
  function toggle_zoom(): void;
}
