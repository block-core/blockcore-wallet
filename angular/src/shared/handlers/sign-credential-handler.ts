import { RequestArguments, Actions, Permission } from '../interfaces';
import { ActionHandler } from './action-handler';

export class SignVerifiableCredentialHandler implements ActionHandler {
  action = ['signerifiableCredential'];

  execute(permission: Permission, args: RequestArguments) {
    console.log('Executing erifiableCredentialHandler!');
    return 'VC SIGNED IN JWT FORMAT!';
  }
}
