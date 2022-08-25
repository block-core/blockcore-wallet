import { ActionMessage, ActionRequest, Actions, Permission } from '../interfaces';
import { ActionHandler } from './action-handler';

export class PublicKeyHandler implements ActionHandler {
  action = ['publicKey'];

  async prepare(args: ActionMessage) {
    return {};
  }

  execute(args: ActionMessage, permission: Permission) {
    console.log('Executing Public Key Handler!');
    return 'your public key!!';
  }
}
