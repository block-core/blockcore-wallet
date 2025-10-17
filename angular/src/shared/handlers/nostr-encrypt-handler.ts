import { BackgroundManager } from '../background-manager';
import { ActionPrepareResult, ActionResponse, Permission } from '../interfaces';
import { ActionHandler, ActionState } from './action-handler';
import { SigningUtilities } from '../identity/signing-utilities';
import { hexToBytes } from 'did-jwt';
const { getPublicKey, nip04 } = require('nostr-tools');
const { v2 } = require('nostr-tools/nip44');

export class NostrEncryptHandler implements ActionHandler {
  action = ['nostr.encrypt'];
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

    // Convert private key to bytes if it's a hex string, otherwise use as-is
    const privateKey = typeof node.privateKey === 'string' ? hexToBytes(node.privateKey) : node.privateKey;
    const publicKeyHex = getPublicKey(privateKey);

    // TODO: Add support for using peer to find existing key, if available! Then read from state.content.peer.
    if (typeof state.content.plaintext !== 'string') {
      state.content.plaintext = JSON.stringify(state.content.plaintext);
    }

    if (state.content.nip44) {
      debugger;
      const conversationKey = v2.utils.getConversationKey(privateKey, state.message.request.params[0].peer);
      const cipher = v2.encrypt(state.content.plaintext, conversationKey);
      return { key: publicKeyHex, response: cipher };
    } else {
      const cipher = nip04.encrypt(privateKey, state.message.request.params[0].peer, state.content.plaintext);
      return { key: publicKeyHex, response: cipher };
    }
  }
}
