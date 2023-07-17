import { Injectable } from '@angular/core';
import { MessageService, NetworkLoader } from 'src/shared';
import { MINUTE } from '../shared/constants';
import { SecureStateService, CryptoUtility, DataSyncService, CommunicationService, WalletManager } from './';
import { StateService } from './state.service';
import { Database } from 'src/shared/store/storage';

@Injectable({
  providedIn: 'root',
})
/** Main logic that is responsible for orchestration of the app. */
export class AppManager {
  constructor(
    public sync: DataSyncService,
    public state: StateService,
    public walletManager: WalletManager,
    public communication: CommunicationService,
    public networkLoader: NetworkLoader,
    public crypto: CryptoUtility,
    public secure: SecureStateService,
    private message: MessageService
  ) {}

  async initialize() {
    await this.communication.initialize();

    await Database.Instance.open();

    // Load all the stores.
    await this.state.load();

    // Then load the secure state.
    await this.secure.load();

    // Reset the reset timer
    this.walletManager.resetTimer();

    this.scheduledWatcher();
  }

  /** The watcher will query the latest receive/change address more frequently than full wallet scan. This method will
   * send a message to the service worker (background) once every 5 minutes if the UI is still active, to ensure that the watch
   * timer is active in the service worker. The service worker can be killed at any moment, so this ensures that it comes
   * back to live. */
  scheduledWatcher() {
    setInterval(() => {
      this.message.send(this.message.createMessage('keep-alive', {}, 'background'));
    }, MINUTE * 5);

    // Activate the watch right away.
    this.message.send(this.message.createMessage('keep-alive', {}, 'background'));
  }
}
