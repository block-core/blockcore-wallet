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
    if (!state.message || !state.message.request || !state.message.request.params || !state.message.request.params[0]) {
      throw Error('The params must include a single entry that has a message field.');
    }

    var params = state.message.request.params[0];

    if (!params.walletId || !params.accountId) {
      throw Error('The params walletId and accountId are missing.');
    }

    return {
      content: state.message.request.params[0],
      consent: false,
    };
  }

  async execute(state: ActionState, permission: Permission): Promise<ActionResponse> {
    var data = state.content as any;

    // get the account
    const { network, account, accountState, accountHistory } = await this.backgroundManager.getAccount(data.walletId, data.accountId);

    if (state.content) {
      return { key: data.key, response: { balance: accountHistory.balance }, network: network.id };
    } else {
      return { key: '', response: null, network: network.id };
    }
  }
}
