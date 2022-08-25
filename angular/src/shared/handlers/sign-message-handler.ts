import { BackgroundManager } from '../background-manager';
import { ActionRequest, Actions, Permission } from '../interfaces';
import { ActionHandler } from './action-handler';
import * as bitcoinMessage from 'bitcoinjs-message';
import { HDKey } from '@scure/bip32';
import { Network } from '../networks';

export class SignMessageHandler implements ActionHandler {
  action = ['signMessage'];

  constructor(private backgroundManager: BackgroundManager) {}

  async signData(network: Network, node: HDKey, content: string): Promise<string> {
    // TODO: Investigate if Paul Miller or someone else implements an message signing library relying on noble packages.
    var signature = bitcoinMessage.sign(content, Buffer.from(node.privateKey), true, network.messagePrefix);
    return signature.toString('base64');
  }

  async prepare(args: ActionRequest) {
    return {};
  }

  async execute(permission: Permission, args: ActionRequest) {
    // Get the private key
    const { network, node } = await this.backgroundManager.getKey(permission.walletId, permission.accountId, permission.keyId);

    if (args.params && args.params[0]) {
      const content = args.params[0].message;
      let signedData = await this.signData(network, node, content);

      console.log('Executing Sign;MessageHandler!', args);
      return { key: permission.key, signature: signedData };
    } else {
      return { key: '', signature: '' };
    }
  }
}
