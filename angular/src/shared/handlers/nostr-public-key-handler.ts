import { BackgroundManager } from '../background-manager';
import { ActionPrepareResult, ActionResponse, Permission } from '../interfaces';
import { ActionHandler, ActionState } from './action-handler';
import { SigningUtilities } from '../identity/signing-utilities';

// Some Nostr resources and tools:

// https://metadata.nostr.com/
// https://alphaama.com/
// https://nostr-army-knife.netlify.app/
// https://nostr-registry.netlify.app/

export class NostrPublicKeyHandler implements ActionHandler {
  action = ['nostr.publickey'];
  utility = new SigningUtilities();

  constructor(private backgroundManager: BackgroundManager) {}

  async prepare(state: ActionState): Promise<ActionPrepareResult> {
    return {
      content: [],
      consent: true,
    };
  }

  async execute(state: ActionState, permission: Permission): Promise<ActionResponse> {
    let publicKey = permission.key;

    // Remove the "nostr:key:" prefix.
    if (publicKey.indexOf(':') > -1) {
      publicKey = publicKey.substring(publicKey.lastIndexOf(':') + 1);
    }

    return {
      request: state.message.request,
      response: publicKey,
    };
  }
}
