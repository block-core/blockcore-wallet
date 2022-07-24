import { RequestArguments, Actions } from '../interfaces';
import { ActionHandler } from './action-handler';

export class PublicKeyHandler implements ActionHandler {
  action = ['publicKey'];

  execute(args: RequestArguments) {
    console.log('Executing Public Key Handler!');
    return 'your public key!!';
  }
}
