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
    if (!state.message || !state.message.request || !state.message.request.params || !state.message.request.params[0] || !state.message.request.params[0]) {
      throw Error('The params must include a single entry that has a message field.');
    }

    var params = !state.message.request.params[0] as any;

    if (!params.walletId || !params.accountId) {
      throw Error('The params must include a single entry that has a message field.');
    }

    return {
      content: state.message.request.params[0],
      consent: false
    };
  }

  async execute(state: ActionState, permission: Permission): Promise<ActionResponse> {

    var params = !state.message.request.params[0] as any;

    // get the account
    const { network, account, accountState } = await this.backgroundManager.getAccount(params.walletId, params.accountId);

    if (state.content)
    {
      return {
        key: permission.key, request: state.message.request, response: { balance: accountState.balance }, network: network.id };
    }
    else
    {
      return { key: '', signature: '', response: null, content: null, request: state.message.request, network: network.id };
    }
  }
}
