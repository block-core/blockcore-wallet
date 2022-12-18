import { BackgroundManager } from '../background-manager';
import { ActionHandler } from './action-handler';
import { DidRequestHandler } from './did-request-handler';
import { DidSupportedMethodsHandler } from './did-supported-methods-handler';
import { PaymentHandler } from './payment-handler';
import { PaymentSignHandler } from './payment-sign-handler';
// import { PublicKeyHandler } from './publicKey-handler';
// import { SignVerifiableCredentialHandler } from './sign-credential-handler';
// import { SignHandler } from './sign-handler';
import { SignMessageHandler } from './sign-message-handler';
import { VcRequestHandler } from './vc-request-handler';
import { AtomicSwapsKeyHandler } from './atomic-swap-key-handler';
import { WalletsHandler } from './wallets-handler';
import { NostrPublicKeyHandler } from './nostr-public-key-handler';
import { NostrSignEventHandler } from './nostr-sign-event-handler';
import { NostrGetRelaysHandler } from './nostr-get-relays-handler';
import { NostrEncryptHandler } from './nostr-encrypt-handler';
import { NostrDecryptHandler } from './nostr-decrypt-handler';

// TODO: Make this more generic where the handlers are registered as form of factory.
export class Handlers {
  static getAction(action: string, backgroundManager: BackgroundManager): ActionHandler {
    switch (action) {
      // case 'sign': // Allows signing any arbitrary bytes without prefix. This can be abused easily and is "dangerous" for users to use. Can be used to sign transactions.
      //   return new SignHandler();
      case 'signMessage': // Signing using a message prefix specific for the network the account belongs to. More secure and cannot be used to sign transactions.
        return new SignMessageHandler(backgroundManager);
      case 'payment':
        return new PaymentHandler(backgroundManager);
      case 'payment.sign':
        return new PaymentSignHandler(backgroundManager);
      case 'did.supportedMethods':
        return new DidSupportedMethodsHandler(backgroundManager);
      case 'did.request':
        return new DidRequestHandler(backgroundManager);
      case 'vc.request':
        return new VcRequestHandler(backgroundManager);
      case 'atomicswaps.keyhandler':
        return new AtomicSwapsKeyHandler(backgroundManager);
      case 'wallets':
        return new WalletsHandler(backgroundManager);
      case 'nostr.publickey':
        return new NostrPublicKeyHandler(backgroundManager);
      case 'nostr.signevent':
        return new NostrSignEventHandler(backgroundManager);
      case 'nostr.getrelays':
        return new NostrGetRelaysHandler(backgroundManager);
      case 'nostr.encrypt':
        return new NostrEncryptHandler(backgroundManager);
      case 'nostr.decrypt':
        return new NostrDecryptHandler(backgroundManager);
      // case 'signVerifiableCredential': // Signing of Verifiable Credential, JSON encoded as signed JSON Web Token.
      //   return new SignVerifiableCredentialHandler();
      // case 'signTypedData': // Not implemented yet, will be inspired by EIP-712: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
      //   return null;
      // case 'publicKey':
      //   return new PublicKeyHandler();
      default:
        throw Error(`Action not supported: ${action}.`);
    }
  }
}

// export * from './publicKey-handler';
// export * from './sign-handler';

export * from './action-handler';
