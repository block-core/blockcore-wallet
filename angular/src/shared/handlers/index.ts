import { ActionHandler } from './action-handler';
import { PublicKeyHandler } from './publicKey-handler';
import { SignVerifiableCredentialHandler } from './sign-credential-handler';
import { SignHandler } from './sign-handler';
import { SignMessageHandler } from './sign-message-handler';

// TODO: Make this more generic where the handlers are registered as form of factory.
export class Handlers {
  static getAction(action: string): ActionHandler {
    switch (action) {
      case 'sign': // Allows signing any arbitrary bytes without prefix. This can be abused easily and is "dangerous" for users to use. Can be used to sign transactions.
        return new SignHandler();
      case 'signMessage': // Signing using a message prefix specific for the network the account belongs to. More secure and cannot be used to sign transactions.
        return new SignMessageHandler();
      case 'signVerifiableCredential': // Signing of Verifiable Credential, JSON encoded as signed JSON Web Token.
        return new SignVerifiableCredentialHandler();
      case 'signTypedData': // Not implemented yet, will be inspired by EIP-712: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
        return null;
      case 'publicKey':
        return new PublicKeyHandler();
      default:
        return null;
    }
  }
}

// export * from './publicKey-handler';
// export * from './sign-handler';

export * from './action-handler';
