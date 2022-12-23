import { BackgroundManager } from '../background-manager';
import { ActionPrepareResult, ActionResponse, Permission } from '../interfaces';
import { ActionHandler, ActionState } from './action-handler';

export class SendTransactionHandler implements ActionHandler {
  action = ['sendtransaction'];

  constructor(private backgroundManager: BackgroundManager) {}

  async prepare(state: ActionState): Promise<ActionPrepareResult> {
    if (!state.message || !state.message.request || !state.message.request.params || !state.message.request.params[0]) {
      throw Error('The params must include a single entry that has a message field.');
    }

    var params = state.message.request.params[0];

    if (!params.data || !params.data.recipents) {
      throw Error('The param recipents is missing.');
    }

    // here we will build the trasnaction and show it to the user

    return {
      content: state.message.request.params[0],
      consent: true
    };
  }

  async execute(state: ActionState, permission: Permission): Promise<ActionResponse> {

    // here we will sign the trasnaction

    if (state.content) {
    

      return { key: '', response: null };
    }
    else {
      return { key: '', response: null };
    }
  }
}
