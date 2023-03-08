import { BackgroundManager } from '../background-manager';
import { ActionPrepareResult, ActionResponse, Permission } from '../interfaces';
import { ActionHandler, ActionState } from './action-handler';
import { validateEvent, signEvent, getEventHash, Event, getPublicKey, nip04 } from 'nostr-tools';
import { SigningUtilities } from '../identity/signing-utilities';

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

    const privateKeyHex = node.privateKey as string;
    
    // TODO: Add support for using peer to find existing key, if available! Then read from state.content.peer.
    if (typeof state.content.plaintext !== 'string') {
      state.content.plaintext = JSON.stringify(state.content.plaintext);
    }
    
    const cipher = await nip04.encrypt(privateKeyHex, state.message.request.params[0].peer, state.content.plaintext);
    
    const publicKeyHex = getPublicKey(privateKeyHex);
    return { key: publicKeyHex, response: cipher };
  }
}
