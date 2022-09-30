import { Wallet } from './interfaces';
import { MessageService } from './message.service';
import { NetworkLoader } from './network-loader';
import { Network } from './networks';
import { StorageService } from './storage.service';
import { WalletStore } from './store';

export class SharedManager {
  /** Contains the master seed for unlocked wallets. This object should never be persisted and only exists in memory. */
  private keys: Map<string, string> = new Map<string, string>();
  private allNetworks: Network[];

  constructor(private storage: StorageService, private store: WalletStore, public networkLoader: NetworkLoader, public message: MessageService) {
    this.allNetworks = this.networkLoader.getAllNetworks();
  }

  getPrivateKey(key: string) {
    return this.keys.get(key);
  }

  unlocked(key: string) {
    return this.keys.get(key) != null;
  }

  async getWallet(walletId: string) {
    /** Always reload the store when getting a wallet in the SharedManager */
    await this.store.load();

    return this.store.get(walletId);
  }

  getAccount(wallet: Wallet, accountId: string) {
    return wallet.accounts.find((a) => a.identifier == accountId);
  }

  getNetwork(networkType: string) {
    return this.allNetworks.find((w) => w.id == networkType);
  }

  async loadPrivateKeys() {
    let keys = await this.storage.get('keys', false);

    if (keys != null && Object.keys(keys).length > 0) {
      this.keys = new Map<string, string>(Object.entries(keys));
    } else {
      this.keys = new Map<string, string>();
    }
  }

  async checkLockTimeout() {
    if (this.storage.runtime.isExtension) {
      const storage = globalThis.chrome.storage as any;

      // Get both "active" (Date) and timeout (number of minutes) from local settings.
      const { active, timeout } = await chrome.storage.local.get(['active', 'timeout']);

      // Reset storage if there is no 'active' state data.
      if (!active) {
        await storage.session.remove(['keys']);
        // await storage.session.clear(); // Might be dramatic to clear to whole session storage?
        console.log('There are no active value, session storage is cleared.');
      } else {
        // Parse the active date.
        const timeoutDate = new Date(active);

        // The reset date is current date minus the timeout.
        var resetDate = new Date(new Date().valueOf() - timeout);

        // Check of the timeout has been reached and clear if it has.
        if (resetDate > timeoutDate) {
          await storage.session.remove(['keys']);

          this.message.send(this.message.createMessage('timeout', {}, 'background'));

          return true;
        }
      }

      return false;
    } else {
      const { active } = JSON.parse(globalThis.localStorage.getItem('active'));
      const { timeout } = JSON.parse(globalThis.localStorage.getItem('timeout'));

      // Reset storage if there is no 'active' state data.
      if (!active) {
        // In the browser, the keys are ONLY in session, we should not persist permanently!
        globalThis.sessionStorage.removeItem('keys');
      } else {
        // Parse the active date.
        const timeoutDate = new Date(active);

        // The reset date is current date minus the timeout.
        var resetDate = new Date(new Date().valueOf() - timeout);

        // Check of the timeout has been reached and clear if it has.
        if (resetDate > timeoutDate) {
          globalThis.sessionStorage.removeItem('keys');

          this.message.send(this.message.createMessage('timeout', {}, 'background'));

          return true;
        }
      }

      return false;
    }
  }
}
