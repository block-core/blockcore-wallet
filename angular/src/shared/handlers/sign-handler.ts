import { ActionRequest, Actions, Permission } from '../interfaces';
import { ActionHandler } from './action-handler';

export class SignHandler implements ActionHandler {
  action = ['sign'];

  async prepare(args: ActionRequest) {
    return {};
  }

  execute(permission: Permission, args: ActionRequest) {
    console.log('Executing SignHandler!');
    return 'chiper!!';
  }
}
