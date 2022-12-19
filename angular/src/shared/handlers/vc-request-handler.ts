import { BackgroundManager } from '../background-manager';
import { ActionHandler, ActionState } from './action-handler';
import { ActionMessage, ActionPrepareResult, ActionRequest, ActionResponse, Actions, DIDRequestResponse, Permission, VCRequestResponse } from '../interfaces';
import * as bitcoinMessage from 'bitcoinjs-message';
import { HDKey } from '@scure/bip32';
import { Network } from '../networks';
import { BlockcoreIdentity, BlockcoreIdentityTools } from '@blockcore/identity';
import { createJWS } from 'did-jwt';

export class VcRequestHandler implements ActionHandler {
  action = ['vc.request'];

  constructor(private backgroundManager: BackgroundManager) {}

  async signData(network: Network, node: HDKey, content: string): Promise<string> {
    // TODO: Investigate if Paul Miller or someone else implements an message signing library relying on noble packages.
    var signature = bitcoinMessage.sign(content, Buffer.from(node.privateKey), true, network.messagePrefix);
    return signature.toString('base64');
  }

  async prepare(state: ActionState): Promise<ActionPrepareResult> {
    return {
      content: {
        type: state.message.request.params[0].type,
        id: state.message.request.params[0].id,
        claim: JSON.parse(state.message.request.params[0].claim),
      },
      consent: true,
    };
  }

  async execute(state: ActionState, permission: Permission): Promise<ActionResponse> {
    // TODO: This is Verifiable Credential (VC) assertion based upon an DID Document and should use assertionMethod keys only.

    // Get the private key
    const { network, node } = await this.backgroundManager.getKey(permission.walletId, permission.accountId, permission.keyId);

    if (state.content) {
      const tools = new BlockcoreIdentityTools();
      const publicKey = node.publicKey;
      const privateKey = node.privateKey;

      const verificationMethod = tools.getVerificationMethod(publicKey, 0, network.symbol);
      const identity = new BlockcoreIdentity(verificationMethod);

      const issuer = tools.getIssuer(identity.did, privateKey);
      const kid = `${verificationMethod.controller}${verificationMethod.id}`;

      const content = state.content as any;
      const vc = await identity.verifiableCredential(content.claim, issuer, kid, content.id, content.type);

      let returnData: ActionResponse = {
        key: permission.key,
        response: {
          did: permission.key,
          vc: vc,
          content: state.content,
        } as VCRequestResponse,
        network: network.id,
      };

      return returnData;
    } else {
      return { key: '', request: state.message.request, network: network.id };
    }
  }
}
