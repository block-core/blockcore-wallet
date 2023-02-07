import { BackgroundManager } from '../background-manager';
import { ActionMessage, ActionPrepareResult, ActionRequest, ActionResponse, Actions, Permission } from '../interfaces';
import { ActionHandler, ActionState } from './action-handler';
import * as bitcoinMessage from 'bitcoinjs-message';
import { HDKey } from '@scure/bip32';
import { Network } from '../networks';
import { SigningUtilities } from '../identity/signing-utilities';

export class AtomicSwapsKeyHandler implements ActionHandler {
  action = ['atomicswaps.key'];
  utility = new SigningUtilities();

  constructor(private backgroundManager: BackgroundManager) {}

  async prepare(state: ActionState): Promise<ActionPrepareResult> {
    if (!state.message || !state.message.request || !state.message.request.params || !state.message.request.params[0]) {
      throw Error('The params must include a single entry that has a message field.');
    }

    var params = state.message.request.params[0];

    if (!params.walletId || !params.accountId) {
      throw Error('The params walletId and accountId are missing.');
    }

    return {
      content: state.message.request.params[0],
      consent: false
    };
  }

  async execute(state: ActionState, permission: Permission): Promise<ActionResponse> {

    var data = state.content as any;

    // get the account
    const { network, node } = await this.backgroundManager.getDerivedKeyFromWalletPath(data.walletId, data.accountId, "0'/0");

    if (state.content)
    {
      var response;

      response = { publicKey: this.utility.keyToHex(node.publicKey) };
      return { key: data.key, request: state.message.request, response: response, network: network.id };
    }
    else
    {
      return { key: '', response: null };
    }
  }
}
