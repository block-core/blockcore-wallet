import { RequestArguments, Actions } from '../interfaces';
import { ActionHandler } from './action-handler';

export class SignVerifiableCredentialHandler implements ActionHandler {
  action = ['signerifiableCredential'];

  execute(args: RequestArguments) {
    console.log('Executing erifiableCredentialHandler!');
    return 'VC SIGNED IN JWT FORMAT!';
  }
}
