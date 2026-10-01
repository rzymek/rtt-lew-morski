import type {Player} from "../../shared/shared";

interface View {
  readonly log: unknown[];
  readonly log_start: number;
  readonly prompt: string;
  readonly actions: {};
}

declare global {
  /** This variable holds the name of the current role the player has in this browser window.
   The value may change if the client is in replay mode. */
  const player: Player;

  /** This object contains the view for the role as returned by the rules view method. */
  const view: View;

  /** Call this when player performs an action (such as clicking on a piece).
   If the action is not in the legal list of actions in the view object,
   this function does nothing and returns false. Returns true if the action is legal.
   */
  function send_action(verb: string, noun: unknown): void;

  /** Show a push button in the top bar for a simple action (if the action is legal). */
  function action_button(verb: string, label: string): void;

  /** Show a push button in the top bar for an action taking a specific argument (if the action with the argument is legal). */
  function action_button_with_argument(verb: string, noun: unknown, label: string): void;

  /** Same as send_action but pop up a confirmation dialog first. */
  function confirm_send_action(verb: string, noun: unknown, question: string): void;

  /** Same as action_button but pop up a confirmation dialog first. */
  function confirm_action_button(verb: string, label: string, question: string): void;

  /** Send a "query" message to the rules. The result will be passed to on_reply. */
  function send_query(what: unknown): void;
}

export {};