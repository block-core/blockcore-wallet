import { BackgroundManager } from '../background-manager';
import { ActionPrepareResult, ActionResponse, Permission } from '../interfaces';
import { ActionHandler, ActionState } from './action-handler';

export class DidSupportedMethodsHandler implements ActionHandler {
  action = ['did.supportedMethods'];

  constructor(private backgroundManager: BackgroundManager) {}

  async prepare(state: ActionState): Promise<ActionPrepareResult> {
    return {
      content: ['did:is', 'did:jwk', 'did:key'],
      consent: false,
    };
  }

  async execute(state: ActionState, permission: Permission): Promise<ActionResponse> {
    return { response: state.content };
  }
}
