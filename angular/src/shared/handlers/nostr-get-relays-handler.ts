import { BackgroundManager } from '../background-manager';
import { ActionPrepareResult, ActionResponse, Permission } from '../interfaces';
import { ActionHandler, ActionState } from './action-handler';

export class NostrGetRelaysHandler implements ActionHandler {
  action = ['nostr.getrelays'];

  constructor(private backgroundManager: BackgroundManager) {}

  async prepare(state: ActionState): Promise<ActionPrepareResult> {
    return {
      content: [
        'wss://nostr-pub.wellorder.net',
        'wss://nostr-relay.untethr.me',
        'wss://nostr.semisol.dev',
        'wss://nostr-pub.semisol.dev',
        'wss://nostr-verified.wellorder.net',
        'wss://nostr.drss.io',
        'wss://relay.damus.io',
        'wss://nostr.openchain.fr',
        'wss://nostr.delo.software',
        'wss://relay.nostr.info',
        'wss://relay.minds.com/nostr/v1/ws',
        'wss://nostr.zaprite.io',
        'wss://nostr.oxtr.dev',
        'wss://nostr.ono.re',
        'wss://relay.grunch.dev',
        'wss://nostr.sandwich.farm',
        'wss://relay.nostr.ch',
      ],
      consent: false,
    };
  }

  async execute(state: ActionState, permission: Permission): Promise<ActionResponse> {
    return {
      request: state.message.request,
      response: state.content,
    };
  }
}
