import { BackgroundManager } from '../background-manager';
import { ActionHandler, ActionState } from './action-handler';
import { ActionMessage, ActionPrepareResult, ActionRequest, ActionResponse, Actions, DIDRequestResponse, Permission } from '../interfaces';
import * as bitcoinMessage from 'bitcoinjs-message';
import { HDKey } from '@scure/bip32';
import { Network } from '../networks';
import { BlockcoreIdentity, BlockcoreIdentityTools } from '@blockcore/identity';
import { createJWS } from 'did-jwt';

export class DidRequestHandler implements ActionHandler {
  action = ['did.request'];

  constructor(private backgroundManager: BackgroundManager) {}

  async signData(network: Network, node: HDKey, content: string): Promise<string> {
    // TODO: Investigate if Paul Miller or someone else implements an message signing library relying on noble packages.
    var signature = bitcoinMessage.sign(content, Buffer.from(node.privateKey), true, network.messagePrefix);
    return signature.toString('base64');
  }

  async prepare(state: ActionState): Promise<ActionPrepareResult> {
    return {
      content: state.message.request.params[0].challenge,
      consent: true,
    };
  }

  async execute(state: ActionState, permission: Permission, secure: any = null): Promise<ActionResponse> {
    // Get the private key
    const { network, node } = await this.backgroundManager.getKey(permission.walletId, permission.accountId, permission.keyId, secure);

    if (state.content) {
      let contentText = state.content;

      const proofContent = {
        challenge: state.content,
        origin: state.message.app,
        type: 'web5.did.get',
      };

      const tools = new BlockcoreIdentityTools();
      const publicKey = node.publicKey;
      const privateKey = node.privateKey;

      const verificationMethod = tools.getVerificationMethod(publicKey, 0, network.symbol);
      const identity = new BlockcoreIdentity(verificationMethod);

      // "jws" or "jwt"?
      // const didDocument = identity.document();
      const jws = await createJWS(proofContent, tools.getSigner(privateKey), { kid: `${identity.did}${verificationMethod.id}` });

      let returnData: ActionResponse = {
        key: permission.key,
        response: {
          did: permission.key,
          proof: jws,
          challenge: state.content,
        } as DIDRequestResponse,
        network: network.id,
      };

      return returnData;
    } else {
      return { key: '', response: null, network: network.id };
    }
  }
}
