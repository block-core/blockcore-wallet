import { BackgroundManager } from '../background-manager';
import { ActionHandler, ActionState } from './action-handler';
import { ActionMessage, ActionPrepareResult, ActionRequest, ActionResponse, Actions, DIDRequestResponse, Permission } from '../interfaces';
import * as bitcoinMessage from 'bitcoinjs-message';
import { HDKey } from '@scure/bip32';
import { Network } from '../networks';

export class DidRequestHandler implements ActionHandler {
  action = ['did.request'];

  constructor(private backgroundManager: BackgroundManager) {}

  async signData(network: Network, node: HDKey, content: string): Promise<string> {
    // TODO: Investigate if Paul Miller or someone else implements an message signing library relying on noble packages.
    var signature = bitcoinMessage.sign(content, Buffer.from(node.privateKey), true, network.messagePrefix);
    return signature.toString('base64');
  }

  async prepare(state: ActionState): Promise<ActionPrepareResult> {
    return {
      content: state.message.request.params[0].challenge,
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

      let returnData: ActionResponse = {
        key: permission.key,
        signature: signedData,
        request: state.message.request,
        content: state.content,
        network: network.id,
        response: {
          did: permission.key,
          proof: signedData,
        } as DIDRequestResponse,
      };

      return returnData;
    } else {
      return { key: '', signature: '', response: null, content: null, request: state.message.request, network: network.id };
    }
    // return {
    //   request: state.message.request,
    //   response: state.content,
    // };
  }
}
