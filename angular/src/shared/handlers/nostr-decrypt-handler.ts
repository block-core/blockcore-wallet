import { BackgroundManager } from '../background-manager';
import { ActionPrepareResult, ActionResponse, Permission } from '../interfaces';
import { ActionHandler, ActionState } from './action-handler';
import { validateEvent, signEvent, getEventHash, Event } from 'nostr-tools';
import { SigningUtilities } from '../identity/signing-utilities';
import { NostrEvent } from '../interfaces/nostr';
import { decrypt } from 'nostr-tools/nip04';

export class NostrDecryptHandler implements ActionHandler {
  action = ['nostr.decrypt'];
  utility = new SigningUtilities();

  constructor(private backgroundManager: BackgroundManager) {}

  async prepare(state: ActionState): Promise<ActionPrepareResult> {
    return {
      content: state.message.request.params[0],
      consent: true,
    };
  }

  async execute(state: ActionState, permission: Permission): Promise<ActionResponse> {
    const { network, node } = await this.backgroundManager.getKey(permission.walletId, permission.accountId, permission.keyId);
    const publicKeyHex = this.utility.getIdentifier(node.publicKey);
    const privateKeyHex = this.utility.keyToHex(node.privateKey);

    const event = decrypt(privateKeyHex, publicKeyHex, state.content.ciphertext);
    return event;
  }
}
