import { BackgroundManager } from '../background-manager';
import { RequestArguments, Actions, Permission } from '../interfaces';
import { ActionHandler } from './action-handler';

export class SignMessageHandler implements ActionHandler {
  action = ['signMessage'];

  constructor(private backgroundManager: BackgroundManager) {

  }

  async execute(permission: Permission, args: RequestArguments) {
    // Get the private key
    const privateKey = await this.backgroundManager.getKey(permission.walletId, permission.accountId, permission.keyId);

    console.log('Executing Sign;MessageHandler!', args);
    return { key: permission.key, signature: 'prefixed signature!' };
  }
}
