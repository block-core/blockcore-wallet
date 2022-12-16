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
    // Get the private key
    const { network, node } = await this.backgroundManager.getKey(permission.walletId, permission.accountId, permission.keyId);

    const publicKeyHex = this.utility.getIdentifier(node.publicKey);

    return {
      request: state.message.request,
      response: publicKeyHex,
    };
  }
}
