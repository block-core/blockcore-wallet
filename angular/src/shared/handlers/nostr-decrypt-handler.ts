import { BackgroundManager } from '../background-manager';
import { ActionPrepareResult, ActionResponse, Permission } from '../interfaces';
import { ActionHandler, ActionState } from './action-handler';
import { SigningUtilities } from '../identity/signing-utilities';
import { hexToBytes } from 'did-jwt';
const { getPublicKey, nip04 } = require('nostr-tools');
const { v2 } = require('nostr-tools/nip44');

export class NostrDecryptHandler implements ActionHandler {
  action = ['nostr.decrypt'];
  utility = new SigningUtilities();

  constructor(private backgroundManager: BackgroundManager) { }

  async prepare(state: ActionState): Promise<ActionPrepareResult> {
    return {
      content: state.message.request.params[0],
      consent: true,
    };
  }

  async execute(state: ActionState, permission: Permission): Promise<ActionResponse> {
    const { network, node } = await this.backgroundManager.getKey(permission.walletId, permission.accountId, permission.keyId);

    const privateKey = hexToBytes(node.privateKey as string);
    const publicKeyHex = getPublicKey(privateKey);

    if (state.content.nip44) {
      const conversationKey = v2.utils.getConversationKey(privateKey, state.message.request.params[0].peer);
      const event = v2.decrypt(state.content.ciphertext, conversationKey);
      return { key: publicKeyHex, response: event };
    } else {
      const event = nip04.decrypt(privateKey, state.message.request.params[0].peer, state.content.ciphertext);
      return { key: publicKeyHex, response: event };
    }
  }
}
