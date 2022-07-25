import { RequestArguments, Actions } from '../interfaces';
import { ActionHandler } from './action-handler';

export class SignMessageHandler implements ActionHandler {
  action = ['signMessage'];

  execute(args: RequestArguments) {
    console.log('Executing Sign;MessageHandler!');
    return 'prefixed signature!';
  }
}
