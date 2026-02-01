import { Injectable, OnInit, NgZone, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { Message, MessageService } from 'src/shared';
import { BackgroundManager, ProcessResult } from 'src/shared/background-manager';
import { SharedManager } from 'src/shared/shared-manager';
import { RunState } from 'src/shared/task-runner';
import { CommunicationService } from './communication.service';
import { EventBus } from '../../shared/event-bus';
import { SettingsService } from './settings.service';
import { StateService } from './state.service';
import { WalletManager } from './wallet-manager';
import { DOCUMENT } from '@angular/common';
import { DidRequestHandler } from 'src/shared/handlers/did-request-handler';
import { SecureStateService } from './secure-state.service';

@Injectable({
  providedIn: 'root',
})
export class FrontendService implements OnInit {
  private watchManager: BackgroundManager | null;
  private networkUpdateInterval = 45000;
  private networkManager: BackgroundManager;
  private networkWatcherRef: any;
  private indexing: boolean;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private ngZone: NgZone,
    private walletManager: WalletManager,
    private events: EventBus,
    private router: Router,
    private state: StateService,
    private settings: SettingsService,
    private secure: SecureStateService,
    private message: MessageService,
    private sharedManager: SharedManager
  ) {
    this.events.subscribeAll().subscribe(async (message) => {
      this.ngZone.run(async () => {
        // Compared to the extension based messaging, we don't have response messages.
        // this.logger.debug(`Process message:`, message);
        await this.handleMessage(message.data);
      });
    });

    // events.subscribe('activated').subscribe(async () => {
    // });

    // events.subscribe('keep-alive').subscribe(async () => {
    // });
  }

  async handleMessage(message: Message) {
    // console.log('FrontendService:handleMessage:', message);
    try {
      switch (message.type) {
        case 'index': {
          await this.executeIndexer();
          return 'ok';
        }
        case 'activated': {
          await this.networkStatusWatcher();
          await this.executeIndexer();
          return 'ok';
        }
        case 'network': {
          await this.networkStatusWatcher();
          await this.executeIndexer();
          return 'ok';
        }
        case 'keep-alive': {
          console.log('keep-alive!!!');
          return 'ok';
        }
        case 'updated': {
          // console.log('SERVICE WORKER HAS FINISHED INDEXING, but no changes to the data, but we get updated wallet info.', message.data);
          await this.state.refresh();
          return 'ok';
        }
        case 'indexed': {
          // console.log('SERVICE WORKER HAS FINISHED INDEXING!!! WE MUST RELOAD STORES!', message.data);
          await this.state.refresh();
          return 'ok';
        }
        case 'did.request': {
          const msg = message as any;
          const handler = new DidRequestHandler(this.networkManager);

          const state: any = {
            content: msg.request.params[0].challenge,
            message: {
              app: msg.app
            }
          }

          const result = await handler.execute(state, msg, this.secure);
          let payload = JSON.stringify(result.response);

          let url = msg.request.params[0].callback;
          url = url.replace('%s', payload);

          this.document.location.href = url;
          return 'ok';
        }
        case 'reload': {
          // console.log('Wallet / Account might be deleted, so we must reload state.');
          await this.state.reload();
          return 'ok';
        }
        case 'network-updated': {
          // console.log('Network status was updated, reload the networkstatus store!');
          await this.state.reloadStore('networkstatus');
          return 'ok';
        }
        case 'store-reload': {
          console.log(`Specific store was requested to be updated: ${message.data}`);
          await this.state.reloadStore(message.data);

          if (message.data === 'setting') {
            await this.settings.update();
          }

          return 'ok';
        }
        case 'timeout': {
          // Timeout was reached in the background. There is already logic listening to the session storage
          // that will reload state and redirect to home (unlock) if needed, so don't do that here. It will
          // cause a race condition on loading new state if redirect is handled here.
          console.log('Timeout was reached in the foreground service.');

          if (this.walletManager.activeWallet) {
            this.walletManager.lockWallet(this.walletManager.activeWallet.id);
          }

          this.router.navigateByUrl('/home');
          return true;
        }
        default:
          console.log(`The message type ${message.type} is not known.`);
          return true;
      }
    } catch (error: any) {
      return { error: { message: error.message, stack: error.stack } };
    }
  }

  async ngOnInit() {
  }

  async networkStatusWatcher() {
    if (this.networkWatcherRef) {
      globalThis.clearTimeout(this.networkWatcherRef);
      this.networkWatcherRef = null;
    }

    if (this.networkManager == null) {
      this.networkManager = new BackgroundManager(this.sharedManager);
    }

    var interval = async () => {
      await this.executeNetworkStatus();

      // Continue running the watcher if it has not been cancelled.
      this.networkWatcherRef = globalThis.setTimeout(interval, this.networkUpdateInterval);
    };

    // First interval we'll wait for complete run.
    await interval();

    // networkWatcherRef = globalThis.setTimeout(async () => {
    //     await interval();
    // }, 0);
  }

  async executeNetworkStatus() {
    // We don't have the Angular environment information available in the service worker,
    // so we'll default to the default blockcore accounts, which should include those that
    // are default on CoinVault.
    await this.networkManager.updateNetworkStatus('blockcore');

    const msg = {
      type: 'network-updated',
      data: { source: 'network-status-watcher' },
      ext: 'blockcore',
      source: 'background',
      target: 'tabs',
      host: location.host,
    };

    this.message.send(msg);
  }

  async executeIndexer() {
    // If we are already indexing, simply ignore this request.
    if (this.indexing) {
      console.log('Already indexing, skipping this indexing request.');
      return;
    }

    this.indexing = true;
    await this.runIndexer();
    this.indexing = false;

    // When the indexer has finished, run watcher automatically.
    await this.runWatcher();
  }

  runIndexer = async () => {
    // Stop and ensure watcher doesn't start up while indexer is running.
    if (this.watchManager) {
      this.watchManager.onStopped = () => { };
      this.watchManager.stop();
      this.watchManager = null;
    }

    // Whenever indexer is executed, we'll create a new manager.
    let manager: any = new BackgroundManager(this.sharedManager);

    manager.onUpdates = (status: ProcessResult) => {
      if (status.changes) {
        const msg = {
          type: 'indexed',
          data: { source: 'indexer-on-schedule' },
          ext: 'blockcore',
          source: 'background',
          target: 'tabs',
          host: location.host,
        };

        this.message.send(msg);
      } else {
        const msg = {
          type: 'updated',
          data: { source: 'indexer-on-schedule' },
          ext: 'blockcore',
          source: 'background',
          target: 'tabs',
          host: location.host,
        };

        this.message.send(msg);
      }
    };

    await manager.runIndexer();

    // Reset the manager after full indexer run.
    manager = null;
  };

  async runWatcher() {
    // If we are indexing, simply ignore all calls to runWatcher.
    if (this.indexing) {
      return;
    }

    // If there are multiple requests incoming to stop the watcher at the same time
    // they will all simply mark the watch manager to stop processing, which will
    // automatically start a new instance when finished.
    if (this.watchManager != null) {
      // First stop the existing watcher process.
      this.watchManager.stop();
      // console.log('Calling to stop watch manager...');
    } else {
      this.watchManager = new BackgroundManager(this.sharedManager);

      // Whenever the manager has successfully stopped, restart the watcher process.
      this.watchManager.onStopped = () => {
        // console.log('Watch Manager actually stopped, re-running!!');
        this.watchManager = null;
        this.runWatcher();
      };

      this.watchManager.onUpdates = (status: ProcessResult) => {
        if (status.changes) {
          const msg = {
            type: 'indexed',
            data: { source: 'watcher' },
            ext: 'blockcore',
            source: 'background',
            target: 'tabs',
            host: location.host,
          };

          this.message.send(msg);
        } else {
          const msg = {
            type: 'updated',
            data: { source: 'watcher' },
            ext: 'blockcore',
            source: 'background',
            target: 'tabs',
            host: location.host,
          };

          this.message.send(msg);
        }
      };

      let runState: RunState = {};

      await this.watchManager.runWatcher(runState);
    }
  }
}
