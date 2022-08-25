import { ActionRequest, Actions, Permission } from '../interfaces';
import { ActionHandler } from './action-handler';

export class PublicKeyHandler implements ActionHandler {
  action = ['publicKey'];

  async prepare(args: ActionRequest) {
    return {};
  }

  execute(permission: Permission, args: ActionRequest) {
    console.log('Executing Public Key Handler!');
    return 'your public key!!';
  }
}
