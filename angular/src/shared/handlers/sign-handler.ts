import { RequestArguments, Actions } from '../interfaces';
import { ActionHandler } from './action-handler';

export class SignHandler implements ActionHandler {
  action = ['sign'];

  execute(args: RequestArguments) {
    console.log('Executing SignHandler!');
    return 'chiper!!';
  }
}
