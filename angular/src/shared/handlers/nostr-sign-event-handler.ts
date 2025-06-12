import { BackgroundManager } from '../background-manager';
import { ActionPrepareResult, ActionResponse, Permission } from '../interfaces';
import { ActionHandler, ActionState } from './action-handler';
import { SigningUtilities } from '../identity/signing-utilities';
import { hexToBytes } from 'did-jwt';
const { validateEvent, getEventHash, getPublicKey, finalizeEvent } = require('nostr-tools');

export class NostrSignEventHandler implements ActionHandler {
  action = ['nostr.signevent'];
  utility = new SigningUtilities();

  constructor(private backgroundManager: BackgroundManager) {}

  async prepare(state: ActionState): Promise<ActionPrepareResult> {
    return {
      content: state.message.request.params[0],
      consent: true,
    };
  }

  async execute(state: ActionState, permission: Permission): Promise<ActionResponse> {
    // Get the private key
    const { network, node } = await this.backgroundManager.getKey(permission.walletId, permission.accountId, permission.keyId);

    // There are no proper
    const event = state.content as any;

    // For nostr we'll derive the public key from private key, since we allow users to BYOK (bring your own key).
    event.pubkey = getPublicKey(hexToBytes(node.privateKey as string));
    if (!event.id) event.id = await getEventHash(event);
    if (!validateEvent(event)) throw new Error('Invalid Nostr event.');

    // Out-of-sync type definitions require an any here. It does return string, even though type definition says otherwise.
    const signature = finalizeEvent(event, hexToBytes(node.privateKey as string)) as any;
    event.sig = signature;

    return { key: event.pubkey, response: event };
  }
}
