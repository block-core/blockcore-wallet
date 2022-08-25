import { BackgroundManager } from '../background-manager';
import { ActionMessage, ActionPrepareResult, ActionRequest, ActionResponse, Actions, Permission } from '../interfaces';
import { ActionHandler } from './action-handler';
import * as bitcoinMessage from 'bitcoinjs-message';
import { HDKey } from '@scure/bip32';
import { Network } from '../networks';

export class VaultSetupHandler implements ActionHandler {
  action = ['vaultSetup'];

  constructor(private backgroundManager: BackgroundManager) {}

  async signData(network: Network, node: HDKey, content: string): Promise<string> {
    // TODO: Investigate if Paul Miller or someone else implements an message signing library relying on noble packages.
    var signature = bitcoinMessage.sign(content, Buffer.from(node.privateKey), true, network.messagePrefix);
    return signature.toString('base64');
  }

  async prepare(args: ActionMessage): Promise<ActionPrepareResult> {
    console.log('VaultSetupHandler:prepare:', args);
    const domain = args.request.params[0].domain;

    // Override the content
    // this.action.content =

    console.log('parsedContent:', domain);
    let setupDocument = this.generateDIDDocument(domain);

    // Content will be overridden by the handler after user closes window.
    // const content = JSON.stringify(setupDocument, null, 2);

    // Therefore we must make sure the updated content for signing is setup as args.
    // this.action.args = [this.action.content];

    const result: ActionPrepareResult = { content: setupDocument };
    return result;
  }

  async execute(args: ActionMessage, permission: Permission): Promise<ActionResponse> {
    // Get the private key
    const { network, node } = await this.backgroundManager.getKey(permission.walletId, permission.accountId, permission.keyId);

    if (args.request.params[0]) {
      const content = args.request.params[0].message;
      let signedData = await this.signData(network, node, content);
      console.log('Executing Sign;MessageHandler!', args);
      return { key: permission.key, signature: signedData, content: content, request: args.request };
    } else {
      return { key: '', signature: '', content: '', request: args.request };
    }
  }

  generateDIDDocument(domain: string) {
    return this.document({
      service: [
        {
          id: '#dwn',
          type: 'DecentralizedWebNode',
          serviceEndpoint: {
            nodes: [domain],
          },
        },
      ],
    });

    // const tools = new BlockcoreIdentityTools();
    // // const keyPair = tools.generateKeyPair();

    // const identityNode = this.identityService.getIdentityNode(this.walletManager.activeWallet, this.walletManager.activeAccount);
    // const privateKey = identityNode.privateKey;
    // const verificationMethod = tools.getVerificationMethod(privateKey);

    // console.log('verificationMethod:', verificationMethod);

    // const identity = new BlockcoreIdentity(verificationMethod);

    // const doc = identity.document();
    // console.log(JSON.stringify(doc));

    // copyToClipboard(JSON.stringify(doc));

    // this.snackBar.open('DID Document copied to clipboard', 'Hide', {
    //   duration: 2500,
    //   horizontalPosition: 'center',
    //   verticalPosition: 'bottom',
    // });

    // const document = await this.identityService.createIdentityDocument(privateKey);
    // console.log(JSON.stringify(document));
  }

  private ordered(a: any, b: any) {
    let comparison = 0;
    if (a.id > b.id) {
      comparison = 1;
    } else if (a.id < b.id) {
      comparison = -1;
    }
    return comparison;
  }

  public document(options: { service: [] } | any = null) {
    const data: any = {};
    // data['@context'] = ['https://www.w3.org/ns/did/v1'];  // We only implement application/did+json
    data.id = '';
    data.verificationMethod = [
      {
        id: '',
        type: '',
        controller: '',
        publicKeyBase58: '',
      },
    ];

    if (options?.service) {
      data.service = options.service.sort(this.ordered);
    }

    // Get the unique ID of the verification method, this might have extra data to make it unique in the list (#key-1).
    data.authentication = [data.verificationMethod.id];
    data.assertionMethod = [data.verificationMethod.id];

    return data;
  }
}
