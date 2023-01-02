import { BackgroundManager } from '../background-manager';
import { ActionPrepareResult, ActionResponse, Permission } from '../interfaces';
import { ActionHandler, ActionState } from './action-handler';
import { validateEvent, signEvent, getEventHash, Event } from 'nostr-tools';
import { SigningUtilities } from '../identity/signing-utilities';
import { encrypt } from 'nostr-tools/nip04';

export class NostrEncryptHandler implements ActionHandler {
  action = ['nostr.encrypt'];
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

    // TODO: Add support for using peer to find existing key, if available! Then read from state.content.peer.
    if (typeof state.content.plaintext !== 'string') {
      state.content.plaintext = JSON.stringify(state.content.plaintext);
    }

    const cipher = encrypt(privateKeyHex, publicKeyHex, JSON.stringify(state.content.plaintext));

    return { key: publicKeyHex, response: cipher };
  }
}
