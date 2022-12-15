import { BackgroundManager } from '../background-manager';
import { ActionPrepareResult, ActionResponse, Permission } from '../interfaces';
import { ActionHandler, ActionState } from './action-handler';
import * as secp from '@noble/secp256k1';

export class NostrPublicKeyHandler implements ActionHandler {
  action = ['nostr.publickey'];

  constructor(private backgroundManager: BackgroundManager) {}

  async prepare(state: ActionState): Promise<ActionPrepareResult> {
    return {
      content: [],
      consent: true,
    };
  }

  // TODO: Migrate the crypto-utility.ts into shared and delete these functions.
  convertEdcsaPublicKeyToSchnorr(publicKey: Uint8Array) {
    if (publicKey.length != 33) {
      throw Error('The public key must be compressed EDCSA public key of length 33.');
    }

    const schnorrPublicKey = publicKey.slice(1);
    return schnorrPublicKey;
  }

  schnorrPublicKeyToHex(publicKey: Uint8Array) {
    return secp.utils.bytesToHex(publicKey);
  }

  getIdentifier(publicKey: Uint8Array) {
    if (publicKey.length == 33) {
      return this.schnorrPublicKeyToHex(this.convertEdcsaPublicKeyToSchnorr(publicKey));
    } else {
      return this.schnorrPublicKeyToHex(publicKey);
    }
  }

  async execute(state: ActionState, permission: Permission): Promise<ActionResponse> {
    // Get the private key
    const { network, node } = await this.backgroundManager.getKey(permission.walletId, permission.accountId, permission.keyId);

    const publicKey = node.publicKey;
    let publicKeyHex = null;

    if (publicKey.length == 33) {
      publicKeyHex = this.schnorrPublicKeyToHex(this.convertEdcsaPublicKeyToSchnorr(publicKey));
    } else {
      publicKeyHex = this.schnorrPublicKeyToHex(publicKey);
    }

    return {
      request: state.message.request,
      response: publicKeyHex,
    };
  }
}
