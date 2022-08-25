import { ActionRequest, Actions, Permission } from '../interfaces';
import { ActionHandler } from './action-handler';

export class SignVerifiableCredentialHandler implements ActionHandler {
  action = ['signerifiableCredential'];

  async prepare(args: ActionRequest) {
    return {};
  }

  execute(permission: Permission, args: ActionRequest) {
    console.log('Executing erifiableCredentialHandler!');
    return 'VC SIGNED IN JWT FORMAT!';
  }
}
