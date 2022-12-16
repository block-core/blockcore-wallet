import { BackgroundManager } from '../background-manager';
import { ActionMessage, ActionPrepareResult, ActionRequest, ActionResponse, Actions, Permission } from '../interfaces';
import { ActionHandler, ActionState } from './action-handler';
import * as bitcoinMessage from 'bitcoinjs-message';
import { HDKey } from '@scure/bip32';
import { Network } from '../networks';

export class WalletsHandler implements ActionHandler {
  action = ['wallets'];

  constructor(private backgroundManager: BackgroundManager) {}

  async prepare(state: ActionState): Promise<ActionPrepareResult> {
    return {
      content: 'Wallet access',
      consent: true,
    };
  }

  async execute(state: ActionState, permission: Permission): Promise<ActionResponse> {
    const result = await this.backgroundManager.getWalletAndAccounts(permission.walletId);

    // Put the Wallet Key public key on the response.
    result.wallet.key = permission.key;

    if (result) {
      return { key: permission.key, request: state.message.request, response: result };
    } else {
      return { key: '', signature: '', response: null, content: null, request: state.message.request };
    }
  }
}
