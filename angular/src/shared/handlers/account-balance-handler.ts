import { BackgroundManager } from '../background-manager';
import { ActionMessage, ActionPrepareResult, ActionRequest, ActionResponse, Actions, Permission } from '../interfaces';
import { ActionHandler, ActionState } from './action-handler';
import * as bitcoinMessage from 'bitcoinjs-message';
import { HDKey } from '@scure/bip32';
import { Network } from '../networks';

export class AccountBalanceHandler implements ActionHandler {
  action = ['accountbalance'];

  constructor(private backgroundManager: BackgroundManager) {}

  async prepare(state: ActionState): Promise<ActionPrepareResult> {
    if (!state.message || !state.message.request || !state.message.request.params || !state.message.request.params[0] || !state.message.request.params[0].pubkey) {
      throw Error('The params must include a single entry that has a message field.');
    }

    return {
      content: state.message.request.params[0].message,
      consent: true
    };
  }

  async execute(state: ActionState, permission: Permission): Promise<ActionResponse> {
    // Get the private key
    const { network, node } = await this.backgroundManager.getKey(permission.walletId, permission.accountId, permission.keyId);
    const { account, accountState } = await this.backgroundManager.getAccount(permission.walletId, permission.accountId, state.message.request.params[0].pubkey);

    if (accountState)
    {
      //let contentText = state.content;

      //if (typeof state.content !== 'string') {
      //  contentText = JSON.stringify(state.content);
      //}

     // let signedData = await this.signData(network, node, contentText as string);

      return {
        key: permission.key, request: state.message.request, response: { balance: accountState.balance }, network: network.id };
    }
    else
    {
      return { key: '', signature: '', response: null, content: null, request: state.message.request, network: network.id };
    }
  }
}
