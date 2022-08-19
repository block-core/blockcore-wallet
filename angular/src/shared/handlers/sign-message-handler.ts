import { BackgroundManager } from '../background-manager';
import { RequestArguments, Actions, Permission } from '../interfaces';
import { ActionHandler } from './action-handler';
import { sha256 } from '@noble/hashes/sha256';
import * as secp from '@noble/secp256k1';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';

export class SignMessageHandler implements ActionHandler {
  action = ['signMessage'];

  constructor(private backgroundManager: BackgroundManager) {}

  async execute(permission: Permission, args: RequestArguments) {
    // Get the private key
    const privateKey = await this.backgroundManager.getKey(permission.walletId, permission.accountId, permission.keyId);
    console.log('ARGS:', args);

    if (args.params && args.params[0]) {
      // var parsedParams = JSON.parse(args.params);
      const content = args.params[0].message;
      const msgHash = sha256(content);
      const sigHash = await secp.sign(msgHash, privateKey.privateKey, { canonical: true });
      const sig = secp.Signature.fromDER(sigHash);
      const signature = sig.toCompactHex();

      console.log('sigHash:', sigHash);
      console.log('sigHash hex:', sig.toCompactHex());

      console.log('Executing Sign;MessageHandler!', args);
      return { key: permission.key, signature: signature, hash: bytesToHex(msgHash) };
    } else {
      return { key: '', signature: '' };
    }
  }
}
