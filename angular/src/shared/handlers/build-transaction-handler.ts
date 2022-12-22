import { BackgroundManager } from '../background-manager';
import { ActionPrepareResult, ActionResponse, Permission } from '../interfaces';
import { ActionHandler, ActionState } from './action-handler';

export class BuildTransactionHandler implements ActionHandler {
  action = ['buildtransaction'];

  constructor(private backgroundManager: BackgroundManager) {}

  async prepare(state: ActionState): Promise<ActionPrepareResult> {
    if (!state.message || !state.message.request || !state.message.request.params || !state.message.request.params[0]) {
      throw Error('The params must include a single entry that has a message field.');
    }

    var params = state.message.request.params[0];

    if (!params.recipents) {
      throw Error('The param recipents is missing.');
    }

    return {
      content: state.message.request.params[0],
      consent: true
    };
  }

  async execute(state: ActionState, permission: Permission): Promise<ActionResponse> {
    // Get the private key
    // const { network, node } = await this.backgroundManager.getKey(permission.walletId, permission.accountId, permission.keyId);
    return { content: null };
  }
}
