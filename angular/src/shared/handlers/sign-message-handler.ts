import { BackgroundManager } from '../background-manager';
import { ActionMessage, ActionPrepareResult, ActionRequest, ActionResponse, Actions, Permission } from '../interfaces';
import { ActionHandler, ActionState } from './action-handler';
import * as bitcoinMessage from 'bitcoinjs-message';
import { HDKey } from '@scure/bip32';
import { Network } from '../networks';

export class SignMessageHandler implements ActionHandler {
  action = ['signMessage'];

  constructor(private backgroundManager: BackgroundManager) {}

  async signData(network: Network, node: HDKey, content: string): Promise<string> {
    // TODO: Investigate if Paul Miller or someone else implements an message signing library relying on noble packages.
    var signature = bitcoinMessage.sign(content, Buffer.from(node.privateKey), true, network.messagePrefix);
    return signature.toString('base64');
  }

  async prepare(state: ActionState): Promise<ActionPrepareResult> {
    if (!state.message || !state.message.request || !state.message.request.params || !state.message.request.params[0] || !state.message.request.params[0].message) {
      throw Error('The params must include a single entry that has a message field.');
    }

    return {
      content: state.message.request.params[0].message,
      consent: true,
    };
  }

  async execute(state: ActionState, permission: Permission): Promise<ActionResponse> {
    // Get the private key
    const { network, node } = await this.backgroundManager.getKey(permission.walletId, permission.accountId, permission.keyId);

    if (state.content) {
      let contentText = state.content;

      if (typeof state.content !== 'string') {
        contentText = JSON.stringify(state.content);
      }

      let signedData = await this.signData(network, node, contentText as string);

      return { key: permission.key, walletId: permission.walletId, accountId: permission.accountId, signature: signedData, content: state.content, network: network.id };
    } else {
      return { key: '', signature: '', content: null, network: network.id };
    }
  }
}
