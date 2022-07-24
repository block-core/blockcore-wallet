import { PublicKeyHandler } from './publicKey-handler';
import { SignHandler } from './sign-handler';

// TODO: Make this more generic where the handlers are registered as form of factory.
export class Handlers {
  static getAction(action: string) {
    if (action == 'sign') {
      return new SignHandler();
    } else if (action === 'pubKey') {
      return new PublicKeyHandler();
    }

    return null;
  }
}

// export * from './publicKey-handler';
// export * from './sign-handler';
