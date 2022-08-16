import { RequestArguments, Actions, Permission } from '../interfaces';
import { ActionHandler } from './action-handler';

export class SignMessageHandler implements ActionHandler {
  action = ['signMessage'];

  execute(permission: Permission, args: RequestArguments) {
    console.log('Executing Sign;MessageHandler!', args);
    return { key: permission.key, signature: 'prefixed signature!' };
  }
}
