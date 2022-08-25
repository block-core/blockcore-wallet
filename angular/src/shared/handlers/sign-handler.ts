import { RequestArguments, Actions, Permission } from '../interfaces';
import { ActionHandler } from './action-handler';

export class SignHandler implements ActionHandler {
  action = ['sign'];

  async prepare(args: RequestArguments) {
    return {};
  }

  execute(permission: Permission, args: RequestArguments) {
    console.log('Executing SignHandler!');
    return 'chiper!!';
  }
}
