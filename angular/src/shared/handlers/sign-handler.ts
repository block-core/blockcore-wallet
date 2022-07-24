import { RequestArguments, Actions } from '../interfaces';

export class SignHandler {
  action = [Actions.sign];

  execute(args: RequestArguments) {
    return 'chiper!!';
  }
}
