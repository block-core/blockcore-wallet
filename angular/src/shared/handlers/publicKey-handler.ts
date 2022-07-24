import { RequestArguments, Actions } from '../interfaces';

export class PublicKeyHandler {
  action = [Actions.publicKey];

  execute(args: RequestArguments) {
    return 'your public key!!';
  }
}
